import { Link } from "expo-router";
import { Image, Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import InputForm from "@/components/InputForm";

export default function loginScreen() {
  return (
    <View className="mx-auto mt-16">
      <Image
        source={require("../../assets/images/logo.png")}
        className="w-72 h-20 mx-auto"
      />

      <Text className="text-center text-4xl font-Inter-Bold mt-24">
        Bienvenido
      </Text>
      <Text className="text-center text-xl font-Inter-Medium color-textGray mb-10">
        Inicia sesión para continuar
      </Text>
      <InputForm placeholder="Ejemplo@gmail.com" label="Email" />
      <InputForm placeholder="Contraseña" label="Contraseña" secure={true} />

      <Link className="mt-5 mb-12" href="/(auth)/register">
        <Text className="font-Inter-Medium color-primary text-md  text-right underline">
          No tienes cuenta? Registrate
        </Text>
      </Link>

      <CustomButton label="Iniciar Sesión" />
    </View>
  );
}
