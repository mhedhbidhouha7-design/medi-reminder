import { Colors } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const CHAT_STORAGE_KEY = "@medi_reminder_chat_history";
const API_ENDPOINT = "http://192.168.1.158:5000/chat";

interface Message {
    id: string;
    type: "user" | "bot";
    text: string;
    timestamp: number;
}

export default function IAScreen() {
    console.log("=== CHATBOT: Component mounted ===");
    console.log("CHATBOT: API Endpoint configured:", API_ENDPOINT);
    console.log("CHATBOT: Storage key:", CHAT_STORAGE_KEY);
    
    const { theme } = useAppTheme();
    const themeColors = Colors[theme];
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);

    // Load chat history on mount
    useEffect(() => {
        console.log("CHATBOT: useEffect - Loading chat history on mount");
        loadChatHistory();
    }, []);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        console.log("CHATBOT: useEffect - Messages changed, count:", messages.length);
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
            console.log("CHATBOT: Auto-scrolled to bottom");
        }, 100);
    }, [messages]);

    // Listen to keyboard events
    useEffect(() => {
        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
            (e) => {
                console.log("CHATBOT: Keyboard showing, height:", e.endCoordinates.height);
                setKeyboardHeight(e.endCoordinates.height);
            }
        );

        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
            () => {
                console.log("CHATBOT: Keyboard hiding");
                setKeyboardHeight(0);
            }
        );

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
        };
    }, []);

    const loadChatHistory = async () => {
        console.log("CHATBOT: Loading chat history...");
        try {
            const storedMessages = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
            console.log("CHATBOT: Retrieved from storage:", storedMessages ? "Data found" : "No data");
            
            if (storedMessages) {
                const parsed = JSON.parse(storedMessages);
                console.log("CHATBOT: Loaded", parsed.length, "messages from history");
                setMessages(parsed);
            } else {
                console.log("CHATBOT: No history found, creating welcome messages");
                const welcomeMessages: Message[] = [
                    {
                        id: Date.now().toString(),
                        type: "bot",
                        text: "Bonjour ! Je suis votre assistant santé IA. Comment puis-je vous aider aujourd'hui ?",
                        timestamp: Date.now(),
                    },
                    {
                        id: (Date.now() + 1).toString(),
                        type: "bot",
                        text: "Décrivez vos symptômes et je vous fournirai une analyse médicale détaillée.",
                        timestamp: Date.now() + 1,
                    },
                ];
                setMessages(welcomeMessages);
                await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(welcomeMessages));
                console.log("CHATBOT: Welcome messages created and saved");
            }
        } catch (error) {
            console.error("CHATBOT: Error loading chat history:", error);
        }
    };

    const saveChatHistory = async (newMessages: Message[]) => {
        console.log("CHATBOT: Saving", newMessages.length, "messages to history");
        try {
            await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(newMessages));
            console.log("CHATBOT: Chat history saved successfully");
        } catch (error) {
            console.error("CHATBOT: Error saving chat history:", error);
        }
    };

    const clearChatHistory = () => {
        console.log("CHATBOT: Clear history requested");
        Alert.alert(
            "Effacer l'historique",
            "Êtes-vous sûr de vouloir supprimer tout l'historique de conversation ?",
            [
                { 
                    text: "Annuler", 
                    style: "cancel",
                    onPress: () => console.log("CHATBOT: Clear history cancelled")
                },
                {
                    text: "Effacer",
                    style: "destructive",
                    onPress: async () => {
                        console.log("CHATBOT: Clearing history...");
                        try {
                            await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
                            console.log("CHATBOT: History removed from storage");
                            setMessages([]);
                            console.log("CHATBOT: Messages state cleared");
                            loadChatHistory();
                            console.log("CHATBOT: Reloaded welcome messages");
                        } catch (error) {
                            console.error("CHATBOT: Error clearing chat history:", error);
                        }
                    },
                },
            ]
        );
    };

    const sendMessage = async () => {
        console.log("=== CHATBOT: sendMessage called ===");
        
        if (!message.trim() || isLoading) {
            console.log("CHATBOT: Message empty or already loading, aborting");
            return;
        }

        console.log("CHATBOT: User message:", message.trim());

        const userMessage: Message = {
            id: Date.now().toString(),
            type: "user",
            text: message.trim(),
            timestamp: Date.now(),
        };

        console.log("CHATBOT: Created user message object:", userMessage);

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        console.log("CHATBOT: Updated messages state with user message");
        
        await saveChatHistory(updatedMessages);
        console.log("CHATBOT: Saved chat history");
        
        setMessage("");
        setIsLoading(true);
        console.log("CHATBOT: Set loading to true");

        try {
            console.log("CHATBOT: Preparing API request...");
            console.log("CHATBOT: API Endpoint:", API_ENDPOINT);
            console.log("CHATBOT: Request body:", JSON.stringify({ message: userMessage.text }));

            // Add timeout to fetch
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.error("CHATBOT: Request timeout after 30 seconds");
                controller.abort();
            }, 30000); // 30 seconds timeout

            const response = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: userMessage.text }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            console.log("CHATBOT: Fetch completed");
            console.log("CHATBOT: Response status:", response.status);
            console.log("CHATBOT: Response ok:", response.ok);

            if (!response.ok) {
                console.error("CHATBOT: HTTP error! status:", response.status);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log("CHATBOT: Parsing JSON response...");
            const data = await response.json();
            console.log("CHATBOT: Response data received");
            console.log("CHATBOT: Response status:", data.status);
            console.log("CHATBOT: Response has 'response' field:", !!data.response);

            if (data.status === "success" && data.response) {
                console.log("CHATBOT: Valid response received");
                console.log("CHATBOT: Response text length:", data.response.length);
                
                const botMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    type: "bot",
                    text: data.response,
                    timestamp: Date.now() + 1,
                };

                console.log("CHATBOT: Created bot message object");

                const finalMessages = [...updatedMessages, botMessage];
                setMessages(finalMessages);
                console.log("CHATBOT: Updated messages state with bot response");
                
                await saveChatHistory(finalMessages);
                console.log("CHATBOT: Saved final chat history");
            } else {
                console.error("CHATBOT: Invalid response format");
                console.error("CHATBOT: Data status:", data.status);
                console.error("CHATBOT: Data response exists:", !!data.response);
                throw new Error("Invalid response format");
            }
        } catch (error) {
            console.error("=== CHATBOT ERROR ===");
            console.error("CHATBOT: Error type:", error instanceof Error ? error.constructor.name : typeof error);
            console.error("CHATBOT: Error message:", error instanceof Error ? error.message : String(error));
            console.error("CHATBOT: Full error:", error);
            
            // Check if it's a network error
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            let userFriendlyMessage = "❌ Désolé, je n'ai pas pu traiter votre demande.\n\n";
            
            if (errorMessage === "Network request failed") {
                console.error("CHATBOT: Network request failed - possible causes:");
                console.error("  1. Server not running on", API_ENDPOINT);
                console.error("  2. CORS issue (if testing on web)");
                console.error("  3. Wrong IP address (use computer IP, not localhost on physical device)");
                console.error("  4. Firewall blocking the connection");
                
                userFriendlyMessage += "Erreur de connexion réseau.\n\n";
                userFriendlyMessage += "Solutions possibles:\n";
                userFriendlyMessage += "• Vérifiez que le serveur est démarré\n";
                userFriendlyMessage += "• Si vous êtes sur un appareil physique, utilisez l'IP de votre ordinateur au lieu de localhost\n";
                userFriendlyMessage += "• Vérifiez votre pare-feu\n\n";
                userFriendlyMessage += `Endpoint: ${API_ENDPOINT}`;
            } else if (errorMessage.includes("aborted")) {
                userFriendlyMessage += "La requête a pris trop de temps (timeout après 30 secondes).\n\n";
                userFriendlyMessage += "Le serveur met peut-être trop de temps à répondre.";
            } else {
                userFriendlyMessage += `Erreur: ${errorMessage}`;
            }
            
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                type: "bot",
                text: userFriendlyMessage,
                timestamp: Date.now() + 1,
            };

            console.log("CHATBOT: Created error message");

            const finalMessages = [...updatedMessages, errorMsg];
            setMessages(finalMessages);
            await saveChatHistory(finalMessages);
            console.log("CHATBOT: Saved error message to history");
        } finally {
            setIsLoading(false);
            console.log("CHATBOT: Set loading to false");
            console.log("=== CHATBOT: sendMessage completed ===");
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={[themeColors.primary, themeColors.tint]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerIconContainer}>
                        <Ionicons name="sparkles" size={28} color={themeColors.background} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.headerTitle, { color: themeColors.background }]}>
                            Assistant IA
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: themeColors.background }]}>
                            Analyse médicale intelligente
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.clearButton} onPress={clearChatHistory}>
                        <Ionicons name="trash-outline" size={20} color={themeColors.background} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {messages.map((msg) => (
                    <View
                        key={msg.id}
                        style={[
                            styles.messageBubble,
                            msg.type === "user"
                                ? [styles.userBubble, { backgroundColor: themeColors.primary }]
                                : [styles.botBubble, { backgroundColor: themeColors.card }],
                        ]}
                    >
                        {msg.type === "bot" && (
                            <View
                                style={[
                                    styles.botIcon,
                                    { backgroundColor: themeColors.primary + "20" },
                                ]}
                            >
                                <Ionicons name="sparkles" size={16} color={themeColors.primary} />
                            </View>
                        )}
                        <Text
                            style={[
                                styles.messageText,
                                msg.type === "user"
                                    ? [styles.userText, { color: themeColors.background }]
                                    : [styles.botText, { color: themeColors.text }],
                            ]}
                        >
                            {msg.text}
                        </Text>
                    </View>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <View
                        style={[
                            styles.messageBubble,
                            styles.botBubble,
                            { backgroundColor: themeColors.card },
                        ]}
                    >
                        <View
                            style={[
                                styles.botIcon,
                                { backgroundColor: themeColors.primary + "20" },
                            ]}
                        >
                            <Ionicons name="sparkles" size={16} color={themeColors.primary} />
                        </View>
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={themeColors.primary} />
                            <Text style={[styles.loadingText, { color: themeColors.icon }]}>
                                Analyse en cours...
                            </Text>
                        </View>
                    </View>
                )}

                {/* Suggested Questions */}
                {messages.length <= 2 && !isLoading && (
                    <View style={styles.suggestionsContainer}>
                        <Text style={[styles.suggestionsTitle, { color: themeColors.text }]}>
                            💡 Exemples de questions
                        </Text>
                        {[
                            "J'ai de la fièvre et des frissons",
                            "J'ai mal à la tête depuis 2 jours",
                            "Je tousse et j'ai du mal à respirer",
                        ].map((suggestion, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.suggestionChip,
                                    {
                                        backgroundColor: themeColors.card,
                                        borderColor: themeColors.primary + "30",
                                    },
                                ]}
                                onPress={() => setMessage(suggestion)}
                            >
                                <Ionicons
                                    name="chatbubble-ellipses-outline"
                                    size={16}
                                    color={themeColors.primary}
                                />
                                <Text style={[styles.suggestionText, { color: themeColors.text }]}>
                                    {suggestion}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={{ height: 180 }} />
            </ScrollView>

            {/* Input with dynamic positioning based on keyboard */}
            <View style={[styles.inputContainer, { bottom: keyboardHeight > 0 ? keyboardHeight + 50 : 90 }]}>
                <View
                    style={[
                        styles.inputWrapper,
                        { backgroundColor: themeColors.card, shadowColor: "#000" },
                    ]}
                >
                    <TextInput
                        style={[styles.input, { color: themeColors.text }]}
                        placeholder="Décrivez vos symptômes..."
                        placeholderTextColor={themeColors.icon + "60"}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!message.trim() || isLoading) && styles.sendButtonDisabled,
                            {
                                backgroundColor:
                                    message.trim() && !isLoading
                                        ? themeColors.primary
                                        : themeColors.card,
                            },
                        ]}
                        onPress={sendMessage}
                        disabled={!message.trim() || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color={themeColors.icon} />
                        ) : (
                            <Ionicons
                                name="send"
                                size={20}
                                color={
                                    message.trim()
                                        ? themeColors.background
                                        : themeColors.icon + "60"
                                }
                            />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent",
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    headerIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 2,
        opacity: 0.9,
    },
    clearButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 20,
        gap: 12,
    },
    messageBubble: {
        maxWidth: "85%",
        padding: 14,
        borderRadius: 18,
        flexDirection: "row",
        gap: 10,
        alignItems: "flex-start",
    },
    userBubble: {
        backgroundColor: "transparent",
        alignSelf: "flex-end",
        borderBottomRightRadius: 6,
    },
    botBubble: {
        backgroundColor: "transparent",
        alignSelf: "flex-start",
        borderBottomLeftRadius: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    botIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 2,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
        flex: 1,
    },
    userText: {
        color: "#fff",
    },
    botText: {
        color: "#1e293b",
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flex: 1,
    },
    loadingText: {
        fontSize: 14,
        fontStyle: "italic",
    },
    suggestionsContainer: {
        marginTop: 16,
        gap: 8,
    },
    suggestionsTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748b",
        marginBottom: 4,
    },
    suggestionChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "transparent",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "transparent",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    suggestionText: {
        fontSize: 14,
        color: "#334155",
        flex: 1,
    },
    inputContainer: {
        
        
        bottom: 90, // Sera ajusté dynamiquement par keyboardHeight
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "flex-end",
        backgroundColor: "transparent",
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
        gap: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: "#1e293b",
        maxHeight: 100,
        paddingVertical: 8,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
    },
    sendButtonDisabled: {
        backgroundColor: "transparent",
    },
});
