import React from "react";
import { Pressable, Text } from "react-native";

interface Props {
  onPress?: () => void;
  label: string;
  disabled?: boolean;
  color?: string;
  borderColor?: string;
  textColor?: string;
}

export default function CustomButton({
  onPress,
  label,
  color = "bg-primary",
  borderColor = "",
  textColor, 
  disabled = false,
}: Props) {
  const finalTextColor = textColor ?? "text-white"; 

  return (
    <Pressable
      className={`${color} ${borderColor} rounded-full mt-5 py-4 ${disabled ? "opacity-50" : "active:opacity-80"}`}
      onPress={disabled ? undefined : onPress}
    >
      <Text className={`${finalTextColor} text-center text-xl font-Inter-Bold`}>
        {label}
      </Text>
    </Pressable>
  );
}

