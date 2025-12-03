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

export default function Signup() {
  const { signUp } = useAuth();
  const navigation = useNavigation<any>();

  const [username, setUsername] = useState("");
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

  async function handleSignup() {
    if (loading) return; // ✅ BLOQUEIA DUPLO CLIQUE

    if (!username || !email || !password) {
      Alert.alert("Atenção", "Preencha todos os campos");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Senha fraca", "A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      if (mountedRef.current) setLoading(true);

      await signUp(username.trim(), email.trim(), password);

      // ✅ NÃO NAVEGA MANUALMENTE
      // O App.tsx controla automaticamente via AuthContext
    } catch (err: any) {
      const message =
        err?.message?.includes("email")
          ? "Esse e-mail já está em uso"
          : err?.message || "Erro ao criar conta";

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
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.logo}>NapSe</Text>
          <Text style={styles.subtitle}>Crie sua conta</Text>
        </View>

        {/* FORM */}
        <View style={styles.form}>
          <TextInput
            placeholder="Username"
            placeholderTextColor="#777"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.input}
          />

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
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Criando conta..." : "Criar conta"}
            </Text>
          </TouchableOpacity>

          {/* LINK PARA LOGIN */}
          <TouchableOpacity
            disabled={loading} // ✅ impede troca de tela no meio do signup
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.link}>
              Já tem conta?{" "}
              <Text style={styles.linkBold}>Entrar</Text>
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
