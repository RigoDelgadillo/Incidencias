import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import CustomButton from "@/components/CustomButton";
import { supabase } from "@/utils/supabase";

// Tipos de datos
type Reporte = {
  id_incidencia: number;
  titulo: string;
  descripcion: string;
};

type Tecnico = {
  id_usuario: string; // UUID
  nombre: string;
  apellido: string;
  id_rol: number;
};

export default function AsignarTecnico() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);

  const [selectedReporteId, setSelectedReporteId] =
    useState<number | null>(null);

  const [selectedTecnicoId, setSelectedTecnicoId] =
    useState<string | null>(null);

  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    cargarListas();
  }, []);

  async function cargarListas() {
    try {
      // REPORTES
      const { data: dataReportes, error: errorReportes } = await supabase
        .from("incidencias")
        .select("id_incidencia, titulo, descripcion");

      if (errorReportes) throw errorReportes;

      // USUARIOS → Filtrar técnicos (id_rol = 3)
      const { data: dataTecnicos, error: errorTecnicos } = await supabase
        .from("usuarios")
        .select("id_usuario, nombre, apellido, id_rol");

      if (errorTecnicos) throw errorTecnicos;

      const tecnicosFiltrados =
        dataTecnicos?.filter((t) => t.id_rol === 3) ?? [];

      setReportes(dataReportes || []);
      setTecnicos(tecnicosFiltrados);
    } catch (err) {
      console.error("Error cargando listas:", err);
      Alert.alert("Error", "No se pudieron cargar listas.");
    }
  }

  async function handleAsignar() {
    if (!selectedReporteId || !selectedTecnicoId) {
      Alert.alert("Error", "Selecciona un reporte y un técnico.");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Obtener un administrador REAL desde la tabla usuarios (id_rol = 1)
      const {
        data: admin,
        error: adminError,
      } = await supabase
        .from("usuarios")
        .select("id_usuario")
        .eq("id_rol", 1)
        .maybeSingle(); // toma solo un admin

      if (adminError) throw adminError;
      if (!admin) {
        Alert.alert(
          "Error",
          "No se encontró un administrador en la tabla usuarios."
        );
        setLoading(false);
        return;
      }

      const idAdministrador = admin.id_usuario as string;

      // 2️⃣ Insertar asignación usando IDs válidos
      const { error } = await supabase.from("asignaciones").insert([
        {
          id_incidencia: selectedReporteId,
          id_administrador: idAdministrador, // UUID del admin de la BD
          id_tecnico: selectedTecnicoId, // UUID del técnico seleccionado
        },
      ]);

      if (error) throw error;

      Alert.alert("Éxito", "Técnico asignado correctamente.");
      setNotas("");
    } catch (err) {
      console.error("Error al asignar técnico:", err);
      Alert.alert("Error", "No se pudo asignar el técnico.");
    } finally {
      setLoading(false);
    }
  }

  // UI PARA CADA REPORTE
  const RenderReporte = ({ item }: { item: Reporte }) => {
    const seleccionado = selectedReporteId === item.id_incidencia;

    return (
      <Pressable
        onPress={() => setSelectedReporteId(item.id_incidencia)}
        className={`p-3 rounded-xl border mb-2 ${
          seleccionado ? "border-primary bg-[#ffe4e9]" : "border-gray-300"
        }`}
      >
        <Text className="font-Inter-Bold">
          #{item.id_incidencia} · {item.titulo}
        </Text>
        <Text className="text-sm text-gray-600" numberOfLines={2}>
          {item.descripcion}
        </Text>
      </Pressable>
    );
  };


  const RenderTecnico = ({ item }: { item: Tecnico }) => {
    const seleccionado = selectedTecnicoId === item.id_usuario;

    return (
      <Pressable
        onPress={() => setSelectedTecnicoId(item.id_usuario)}
        className={`p-3 rounded-xl border mb-2 ${
          seleccionado ? "border-primary bg-[#e3ffe4]" : "border-gray-300"
        }`}
      >
        <Text className="font-Inter-Bold">
          {item.nombre} {item.apellido}
        </Text>
      </Pressable>
    );
  };

  // ---------- UI FINAL ----------
  return (
    <View className="mx-auto mt-10 w-[380px]">
      

      {/* LISTA DE REPORTES */}
      <Text className="text-lg font-Inter-Bold mb-2">
        Seleccionar reporte
      </Text>
      <FlatList
        data={reportes}
        renderItem={RenderReporte}
        keyExtractor={(item) => item.id_incidencia.toString()}
        style={{ maxHeight: 150 }}
      />

      {/* LISTA DE TÉCNICOS */}
      <Text className="text-lg font-Inter-Bold mt-4 mb-2">
        Seleccionar técnico
      </Text>
      <FlatList
        data={tecnicos}
        renderItem={RenderTecnico}
        keyExtractor={(item) => item.id_usuario}
        style={{ maxHeight: 150 }}
      />

      {/* NOTAS */}
      <Text className="text-lg font-Inter-Bold mt-4">Notas (opcional)</Text>
      <TextInput
        className="w-full h-28 bg-bgGray rounded-lg px-4 py-2 mt-2"
        placeholder="Escribe instrucciones para el técnico..."
        value={notas}
        onChangeText={setNotas}
        multiline
        textAlignVertical="top"
      />

      {/* BOTÓN */}
      <View className="mt-6">
        <CustomButton
          label={loading ? "Asignando..." : "Asignar técnico"}
          onPress={handleAsignar}
          disabled={loading}
        />
      </View>
    </View>
  );
}
