import DateTimePicker, {
  AndroidNativeProps,
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

import CustomButton from "@/components/CustomButton";
import InputForm from "@/components/InputForm";

type Technician = { id: string; name: string };

export default function asignartecnico() {
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showTechModal, setShowTechModal] = useState(false);
  const [showIOSPicker, setShowIOSPicker] = useState(false); // solo iOS

  const technicians = useMemo<Technician[]>(
    () => [
      { id: "1", name: "Ana López" },
      { id: "2", name: "Carlos Ruiz" },
      { id: "3", name: "María Pérez" },
      { id: "4", name: "Juan Torres" },
    ],
    []
  );

  const formatDateTime = (d: Date | null) => {
    if (!d) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    const DD = pad(d.getDate());
    const MM = pad(d.getMonth() + 1);
    const YYYY = d.getFullYear();
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${DD}/${MM}/${YYYY} ${hh}:${mm}`;
  };

  // --- Apertura de calendario según plataforma ---
  const openDatePicker = () => {
    // cierra el modal de técnicos si estuviera abierto para evitar superposición
    setShowTechModal(false);

    if (Platform.OS === "android") {
      // 1) Abrimos el "date"
      DateTimePickerAndroid.open({
        value: deadline ?? new Date(),
        mode: "date",
        onChange: (_event, date) => {
          if (date) {
            // 2) Luego abrimos el "time"
            DateTimePickerAndroid.open({
              value: date,
              mode: "time",
              is24Hour: true,
              onChange: (_event2, dateTime) => {
                if (dateTime) setDeadline(dateTime);
              },
            } as AndroidNativeProps);
          }
        },
      } as AndroidNativeProps);
    } else {
      // iOS: mostramos inline
      setShowIOSPicker(true);
    }
  };

  return (
    <View className="mx-auto mt-16">
      {/* Título */}
      <Text className="text-center text-4xl font-Inter-Bold mb-10">
        Asignar Tecnico
      </Text>

      {/* Referencia rápida */}
      <Text className="text-textGray text-base mb-2 text-left">
        REFERENCIA RAPIDA DEL REPORTE
      </Text>
      <View className="border border-gray-300 rounded-lg p-4 mb-6 w-[380px]">
        <Text className="text-lg font-Inter-Medium">
          Falla en el sistema de iluminacion
        </Text>
        <Text className="text-textGray text-sm">Reporte #12345</Text>
      </View>

      {/* Selección del técnico */}
      <Text className="text-textGray text-base mb-2 text-left">
        SELECCION DEL TECNICO
      </Text>
      <SelectField
        value={selectedTech?.name ?? ""}
        placeholder="Seleccionar tecnico"
        onPress={() => setShowTechModal(true)}
      />

      {/* Fecha límite */}
      <Text className="text-textGray text-base mt-6 mb-2 text-left">
        DETALLES ADICIONALES Y PLAZOS
      </Text>
      <DateField
        value={formatDateTime(deadline)}
        placeholder="DD/MM/AAAA HH:MM"
        onPress={openDatePicker}
      />

      {/* iOS inline picker (no lo renderizamos en Android para evitar “colapso”) */}
      {Platform.OS === "ios" && showIOSPicker && (
        <View className="w-[380px] bg-white border border-gray-200 rounded-lg mt-3">
          <DateTimePicker
            value={deadline ?? new Date()}
            mode="datetime"
            display="inline"
            onChange={(_e, date) => {
              if (date) setDeadline(date);
            }}
          />
          <Pressable
            onPress={() => setShowIOSPicker(false)}
            className="p-3 items-center"
          >
            <Text className="text-blue-600 font-Inter-Medium">Listo</Text>
          </Pressable>
        </View>
      )}

      {/* Notas */}
      <InputForm
        label="Notas y comentarios (para el tecnico)"
        placeholder="Añadir instrucciones adicionales..."
      />

      {/* Botones */}
      <View className="flex-row justify-between mt-10 mb-10 w/[380px] w-[380px]">
        <View className="flex-1 mr-3">
          <CustomButton label="Cancelar" />
        </View>
        <View className="flex-1">
          <CustomButton label="Confirmar Asignacion" />
        </View>
      </View>

      {/* Modal: lista de técnicos */}
      <Modal transparent animationType="fade" visible={showTechModal}>
        <Pressable
          className="flex-1 bg-black/40 items-center justify-center px-6"
          onPress={() => setShowTechModal(false)}
        >
          <View className="w-full max-w-[420px] bg-white rounded-2xl p-4">
            <Text className="text-lg font-Inter-Bold mb-2">
              Seleccionar tecnico
            </Text>
            <FlatList
              data={technicians}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => (
                <View className="h-[1px] bg-gray-200" />
              )}
              renderItem={({ item }) => (
                <Pressable
                  className="py-3"
                  onPress={() => {
                    setSelectedTech(item);
                    setShowTechModal(false);
                  }}
                >
                  <Text className="text-base">{item.name}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}


function SelectField({
  value,
  placeholder,
  onPress,
}: {
  value: string;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <View className="mt-1">
      <Text className="text-textGray text-lg mb-1">Seleccionar tecnico</Text>
      <Pressable
        onPress={onPress}
        className="w-[380px] h-[50px] bg-bgGray rounded-lg px-5 flex-row items-center justify-between"
      >
        <Text className={value ? "text-black" : "text-gray-400"}>
          {value || placeholder}
        </Text>
        <Text className="text-gray-500">▾</Text>
      </Pressable>
    </View>
  );
}

function DateField({
  value,
  placeholder,
  onPress,
}: {
  value: string;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <View className="mt-1">
      <Text className="text-textGray text-lg mb-1">Fecha/Hora Limite</Text>
      <Pressable
        onPress={onPress}
        className="w-[380px] h-[50px] bg-bgGray rounded-lg px-5 flex-row items-center justify-between"
      >
        <Text className={value ? "text-black" : "text-gray-400"}>
          {value || placeholder}
        </Text>
        <Text>🗓️</Text>
      </Pressable>
    </View>
  );
}

