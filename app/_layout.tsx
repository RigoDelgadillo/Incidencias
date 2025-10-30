import { useFonts } from "expo-font";
import { Slot, SplashScreen } from "expo-router";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { Keyboard, TouchableWithoutFeedback } from "react-native";
import "./global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    "Inter_18pt-Bold": require("../assets/fonts/Inter_18pt-Bold.ttf"),
    "Inter_18pt-Medium": require("../assets/fonts/Inter_18pt-Medium.ttf"),
    "Inter_18pt-Regular": require("../assets/fonts/Inter_18pt-Regular.ttf"),
  });

  useEffect(() => {
    if (error) throw error;

    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded && !error) return null;

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView>
        <Slot />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
