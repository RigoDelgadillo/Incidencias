import { Link } from "expo-router";
import { Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import InputForm from "@/components/InputForm";

export default function registerScreen() {
  return (
    <View className="mx-auto mt-16">
      <Text
        className="text-center text-4xl font-Inter-Bold mt-10
      "
      >
        Bienvenido
      </Text>
      <Text className="text-center text-xl font-Inter-Medium color-textGray mb-10">
        Registrate para continuar
      </Text>
      <InputForm placeholder="Escribe tu nombre" label="Nombre" />
      <InputForm placeholder="Escribe tu apellido" label="Apellido" />
      <InputForm
        placeholder="Escribe tu numero de telefono"
        label="Telefono"
        isNumber={true}
      />
      <InputForm placeholder="Ejemplo@gmail.com" label="Email" />
      <InputForm placeholder="Contraseña" label="Contraseña" secure={true} />

      <Link className="mt-12 mb-12" href="/(auth)/login">
        <Text className="font-Inter-Medium color-primary text-md  text-right underline">
          Ya tienes cuenta? Inicia sesión
        </Text>
      </Link>

      <CustomButton label="Registrarse" />
    </View>
  );
}
