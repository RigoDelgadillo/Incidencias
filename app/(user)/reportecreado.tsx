import { supabase } from "@/utils/supabase";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";

type Reporte = {
  id_incidencia: number;
  titulo: string;
  descripcion: string;
  fecha_creacion: string;
  id_usuario: string;
};

export default function ListaReportes() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarReportes();
  }, []);

  async function cargarReportes() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("incidencias")
        .select(
          "id_incidencia, titulo, descripcion, fecha_creacion, id_usuario"
        )
        .order("fecha_creacion", { ascending: false });

      if (error) throw error;

      setReportes(data ?? []);
    } catch (err) {
      console.error("Error listando reportes:", err);
      Alert.alert("Error", "No se pudieron cargar los reportes.");
    } finally {
      setLoading(false);
    }
  }

  const RenderReporte = ({ item }: { item: Reporte }) => (
    <View className="rounded-xl border border-gray-300 p-4 mb-3 bg-white">
      <Text className="font-Inter-Bold text-lg">
        {item.titulo}
      </Text>

      <Text className="text-gray-600 mt-1" numberOfLines={2}>
        {item.descripcion}
      </Text>

      <Text className="text-xs text-gray-500 mt-2">
        Creado: {new Date(item.fecha_creacion).toLocaleString()}
      </Text>

      <Text className="text-xs text-gray-500">
        Usuario ID: {item.id_usuario}
      </Text>
    </View>
  );

  return (
    <View className="mx-auto mt-10 w-[380px]">

      {/* HEADER */}
      <View className="flex-row justify-between items-center mb-4">
        <Link href="/(user)">
          <Text className="text-2xl">←</Text>
        </Link>
        <Text className="text-xl font-Inter-Bold">Reportes creados</Text>
      </View>

      {/* ESTADO */}
      {loading && (
        <Text className="text-gray-500 mb-2">Cargando reportes...</Text>
      )}

      {!loading && reportes.length === 0 && (
        <Text className="text-gray-500 text-center mt-4">
          No hay reportes creados aún.
        </Text>
      )}

      {/* LISTA */}
      <FlatList
        data={reportes}
        renderItem={RenderReporte}
        keyExtractor={(item) => item.id_incidencia.toString()}
        style={{ maxHeight: 600 }}
      />
    </View>
  );
}