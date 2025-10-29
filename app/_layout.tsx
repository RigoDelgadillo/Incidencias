import { Text, View } from "react-native";

import "../global.css";

export default function RootLayout() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-blue-500">
        Hola mundo desde RootLayout con NativeWind!
      </Text>
    </View>
  );
}
