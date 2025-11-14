// MODIFICADO: Eliminamos 'useNavigation'
import IncidenciaDetalleModal from "@/components/IncidenciaDetalleModal";
import { supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";

interface Incidencia {
  id_incidencia: number;
  titulo: string;
  descripcion: string;
  id_estado: number;
  fecha_creacion: string;
  id_prioridad: number;
  usuarios: {
    nombre: string;
    apellido: string;
  } [] | null;
  
}


export default function Index() {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIncidencia, setSelectedIncidencia] =
    useState<Incidencia | null>(null);

  const getIncidencias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("incidencias")
        .select(`id_incidencia, titulo,  descripcion, id_estado, fecha_creacion, id_prioridad, usuarios (nombre, apellido) `)
        .order("fecha_creacion", { ascending: false });

      if (error) throw error;
      setIncidencias(data || []);
    } catch (err: any) {
      Alert.alert("Error", `No se pudieron cargar los reportes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getIncidencias();
  }, []);

  const getPrioridadColor = (id_prioridad: number) => {
    switch (id_prioridad) {
      case 1:
        return "border-red-500";
      case 2:
        return "border-yellow-400";
      case 3:
        return "border-green-500";
      default:
        return "border-gray-300";
    }
  };

  const getEstadoTexto = (id_estado: number) => {
    switch (id_estado) {
      case 1:
        return "Nuevo";
      case 2:
        return "En proceso";
      case 3:
        return "Resuelto";
      default:
        return "Desconocido";
    }
  };

  const handleOpenModal = (incidencia: Incidencia) => {
    setSelectedIncidencia(incidencia);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedIncidencia(null);
  };

  const renderIncidencia = ({ item }: { item: Incidencia }) => (
    <TouchableOpacity
      onPress={() => handleOpenModal(item)}
      className={`flex-row items-center justify-between bg-white rounded-xl border-l-4 px-4 py-3 shadow-sm mt-4 mx-4 ${getPrioridadColor(
        item.id_prioridad
      )}`}
    >
      <View className="flex-1">
        <Text className="text-xl font-semibold text-gray-900" numberOfLines={1}>
          {item.titulo}
        </Text>
        <Text className="text-sm text-gray-600">
          {getEstadoTexto(item.id_estado)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {loading ? (
        <Text className="text-center text-gray-600 mt-10">
          Cargando reportes...
        </Text>
      ) : incidencias.length === 0 ? (
        <Text className="text-center text-gray-600 mt-10">
          No hay reportes registrados
        </Text>
      ) : (
        <FlatList
          data={incidencias}
          renderItem={renderIncidencia}
          keyExtractor={(item) => item.id_incidencia.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
      <IncidenciaDetalleModal
        visible={modalVisible}
        incidencia={selectedIncidencia}
        onClose={handleCloseModal}
      />
    </View>
  );
}