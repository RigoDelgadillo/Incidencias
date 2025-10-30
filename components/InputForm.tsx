import React from "react";
import { Text, TextInput, View } from "react-native";

interface Props {
  label: string;
  placeholder?: string;
}

export default function InputForm({ label, placeholder }: Props) {
  return (
    <View className="mt-8">
      <Text className="text-textGray text-lg">{label}</Text>

      <TextInput
        className="w-[380px] h-[50px] bg-bgGray rounded-lg px-5"
        placeholder={placeholder}
      />
    </View>
  );
}
