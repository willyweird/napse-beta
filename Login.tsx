import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

export default function Login() {
  const { signIn } = useAuth();
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ CONTROLE DE MONTAGEM (ANTI setState APÓS UNMOUNT)
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function handleLogin() {
    if (loading) return; // ✅ BLOQUEIA DUPLO CLIQUE

    if (!email || !password) {
      Alert.alert("Atenção", "Preencha todos os campos");
      return;
    }

    try {
      if (mountedRef.current) setLoading(true);

      await signIn(email.trim(), password);

      // ✅ NÃO NAVEGA MANUALMENTE
      // O App.tsx reage automaticamente ao user via AuthContext
    } catch (err: any) {
      const message =
        err?.message?.includes("credenciais") ||
        err?.message?.includes("401")
          ? "E-mail ou senha incorretos"
          : err?.message || "Erro ao fazer login";

      Alert.alert("Erro", message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        {/* LOGO / TÍTULO */}
        <View style={styles.header}>
          <Text style={styles.logo}>NapSe</Text>
          <Text style={styles.subtitle}>Entre na sua conta</Text>
        </View>

        {/* FORM */}
        <View style={styles.form}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#777"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <TextInput
            placeholder="Senha"
            placeholderTextColor="#777"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Entrando..." : "Entrar"}
            </Text>
          </TouchableOpacity>

          {/* LINK PARA SIGNUP */}
          <TouchableOpacity
            disabled={loading} // ✅ BLOQUEIA TROCA DE TELA DURANTE LOGIN
            onPress={() => navigation.navigate("Signup")}
          >
            <Text style={styles.link}>
              Não tem conta?{" "}
              <Text style={styles.linkBold}>Criar agora</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  header: {
    alignItems: "center",
    marginBottom: 48,
  },

  logo: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 2,
  },

  subtitle: {
    marginTop: 8,
    color: "#777",
    fontSize: 15,
  },

  form: {
    width: "100%",
  },

  input: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#111",
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#222",
  },

  button: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },

  link: {
    marginTop: 22,
    textAlign: "center",
    color: "#777",
    fontSize: 14,
  },

  linkBold: {
    color: "#fff",
    fontWeight: "bold",
  },
});
