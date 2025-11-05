import React from "react";
import { Text, TextInput, View } from "react-native";

interface Props {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  secure?: boolean;
  isNumber?: boolean;
}

export default function InputForm({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  isNumber = false,
}: Props) {
  return (
    <View className="mt-4">
      <Text className="text-textGray text-lg">{label}</Text>

      <TextInput
        className="w-[380px] h-[50px] bg-bgGray rounded-lg px-5"
        placeholder={placeholder}
        secureTextEntry={secure}
        keyboardType={isNumber ? "phone-pad" : "default"}
        maxLength={isNumber ? 15 : undefined}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}
