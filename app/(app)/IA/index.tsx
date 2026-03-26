import { Colors } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function IAScreen() {
    const { theme } = useAppTheme();
    const themeColors = Colors[theme];
    const { colors } = useTheme();
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: "bot",
            text: "Bonjour ! Je suis votre assistant santé IA. Comment puis-je vous aider aujourd'hui ?",
        },
        {
            id: 2,
            type: "bot",
            text: "Je peux vous aider avec vos médicaments, vos rendez-vous, ou répondre à vos questions de santé.",
        },
    ]);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const sendMessage = () => {
        if (!message.trim()) return;

        const userMsg = {
            id: messages.length + 1,
            type: "user",
            text: message.trim(),
        };

        const botReply = {
            id: messages.length + 2,
            type: "bot",
            text: "Merci pour votre message. Cette fonctionnalité IA sera bientôt connectée à un modèle intelligent pour vous fournir des réponses personnalisées.",
        };

        setMessages((prev) => [...prev, userMsg, botReply]);
        setMessage("");
    };

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }] }>
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
                    <View>
                            <Text style={[styles.headerTitle, { color: themeColors.background }]}>Assistant IA</Text>
                            <Text style={[styles.headerSubtitle, { color: themeColors.background }]}>Votre assistant santé intelligent</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Messages */}
            <ScrollView
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
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
                            <View style={[styles.botIcon, { backgroundColor: themeColors.card }]}> 
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

                {/* Suggested Questions */}
                <View style={styles.suggestionsContainer}>
                    <Text style={[styles.suggestionsTitle, { color: themeColors.text }]}>Suggestions</Text>
                    {[
                        "Quels sont les effets secondaires de mes médicaments ?",
                        "Rappelle-moi mes prochains rendez-vous",
                        "Conseils pour améliorer mon sommeil",
                    ].map((suggestion, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.suggestionChip, { backgroundColor: themeColors.card, borderColor: themeColors.tint }]}
                            onPress={() => setMessage(suggestion)}
                        >
                            <Ionicons
                                name="chatbubble-ellipses-outline"
                                size={16}
                                color={themeColors.primary}
                            />
                            <Text style={[styles.suggestionText, { color: themeColors.text }]}>{suggestion}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, { backgroundColor: themeColors.card, shadowColor: "#000" }]}> 
                    <TextInput
                        style={[styles.input, { color: themeColors.text }]}
                        placeholder="Posez votre question..."
                        placeholderTextColor={themeColors.icon + "60"}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            !message.trim() && styles.sendButtonDisabled,
                            { backgroundColor: message.trim() ? themeColors.primary : themeColors.card }
                        ]}
                        onPress={sendMessage}
                        disabled={!message.trim()}
                    >
                        <Ionicons
                            name="send"
                            size={20}
                            color={message.trim() ? themeColors.background : themeColors.icon + "60"}
                        />
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
        backgroundColor: "transparent",
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
        position: "absolute",
        bottom: 90,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
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
