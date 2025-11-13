import React from "react";
import { Pressable, Text } from "react-native";

interface Props {
  onPress?: () => void;
  label: string;
  disabled?: boolean;
  color?: string;
}

export default function CustomButton({ onPress, label, color="bg-primary" }: Props) {
  return (
    <Pressable
      className={`${color} rounded-full mt-10 py-4 active:opacity-80`}
      onPress={onPress}
    >
      <Text className="text-white text-center text-xl font-Inter-Bold">
        {label}
      </Text>
    </Pressable>
  );
}

