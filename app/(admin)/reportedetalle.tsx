// app/(admin)/reporte-detalle.tsx
import CustomButton from "@/components/CustomButton";
import { Link, router } from "expo-router";
import { Text, View } from "react-native";

export default function reportedetalle() {
  // Datos de ejemplo; luego puedes traerlos de props/estado/API
  const data = {
    id: "#12345",
    asunto: "Maquina descompuesta",
    descripcion: "No esta funcionando como debe de trabajar",
    estado: "Pendiente",
    fecha: "15 de mayo de 2025, 10:30 AM",
    reportadoPor: "Pedro Martinez",
    ubicacion: "Área de maquinas",
  };

  return (
    <View className="mx-auto mt-10">
      {/* Header simple con “regresar” y título corto */}
      <View className="w-[380px] flex-row items-center justify-between mb-6">
        <Link href="/(auth)/login">
          <Text className="text-2xl">←</Text>
        </Link>
        <Text className="text-lg font-Inter-Bold">Reporte {data.id}</Text>
        <View className="w-6" />
      </View>

      {/* Título grande */}
      <Text className="text-4xl font-Inter-Bold mb-6">Informacion General</Text>

      {/* Bloques de detalle */}
      <FieldCard label="ID del Reporte" value={data.id} />

      <FieldCard label="Asunto" value={data.asunto} />

      <FieldCard label="Descripcion" value={data.descripcion} multiline />

      {/* Estado con “badge” */}
      <View className="w-[380px] border border-gray-300 rounded-xl px-4 py-3 mb-3">
        <Text className="text-textGray font-Inter-Bold mb-1">Estado</Text>
        <View className="self-start bg-blue-100 px-3 py-1 rounded-full">
          <Text className="text-blue-700 font-Inter-Medium">{data.estado}</Text>
        </View>
      </View>

      <FieldCard label="Fecha de Creacion" value={data.fecha} />
      <FieldCard label="Reportado por:" value={data.reportadoPor} />
      <FieldCard label="Ubicacion" value={data.ubicacion} />

      {/* Botón inferior */}
      <View className="w-[380px] mt-8">
        <CustomButton
          label="Asignar Tecnico"
          onPress={() => router.push("/(admin)/asignartecnico")}
        />
      </View>
    </View>
  );
}

/* ---- Subcomponente local para no tocar tus componentes ---- */
function FieldCard({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View className="w-[380px] border border-gray-300 rounded-xl px-4 py-3 mb-3">
      <Text className="text-textGray font-Inter-Bold mb-1">{label}</Text>
      <Text
        className={`text-base ${multiline ? "leading-6" : ""}`}
        numberOfLines={multiline ? undefined : 1}
      >
        {value}
      </Text>
    </View>
  );
}

