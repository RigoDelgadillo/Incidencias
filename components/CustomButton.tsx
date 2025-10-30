import React from "react";
import { Pressable, Text } from "react-native";

interface Props {
  onPress?: () => void;
  label: string;
}

export default function CustomButton({ onPress, label }: Props) {
  return (
    <Pressable
      className="bg-primary rounded-lg py-4 px-10 active:opacity-80"
      onPress={onPress}
    >
      <Text className="text-white text-center text-xl font-Inter-Bold">
        {label}
      </Text>
    </Pressable>
  );
}
