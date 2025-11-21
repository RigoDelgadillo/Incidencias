import CustomButton from "@/components/CustomButton";
import { supabase } from "@/utils/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// 1. INTERFAZ ACTUALIZADA
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
  }[] | null;
}

export default function Index() {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIncidencia, setSelectedIncidencia] = useState<Incidencia | null>(null);

  const getIncidencias = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        Alert.alert("Sesión no encontrada", "Por favor inicia sesión nuevamente.");
        return;
      }

      const { data, error } = await supabase
        .from("incidencias")
        .select(
          `
          id_incidencia, 
          titulo, 
          descripcion, 
          id_estado, 
          fecha_creacion, 
          id_prioridad,
          usuarios ( nombre, apellido ) 
        `
        )
        .eq("id_usuario", user.id)
        .order("fecha_creacion", { ascending: false });

      if (error) throw error;
      setIncidencias(data || []);
    } catch (err: any) {
      Alert.alert("Error", `No se pudieron cargar los reportes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getIncidencias();
  }, [getIncidencias]);

  useFocusEffect(
    useCallback(() => {
      getIncidencias();
    }, [getIncidencias])
  );

  const getPrioridadTextColor = (id_prioridad: number) => {
    switch (id_prioridad) {
      case 1:
        return "text-green-500"; // Baja
      case 2:
        return "text-yellow-500"; // Media (Usamos 600 para mejor contraste)
      case 3:
        return "text-red-500"; // Alta
      default:
        return "text-gray-300"; // Desconocida
    }
  };

  const getPrioridadColor = (id_prioridad: number) => {
    switch (id_prioridad) {
      case 1:
        return "border-green-500";
      case 2:
        return "border-yellow-400";
      case 3:
        return "border-red-500";
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

  const getPrioridadTexto = (id_prioridad: number) => {
    switch (id_prioridad) {
      case 1:
        return "Baja";
      case 2:
        return "Media";
      case 3:
        return "Alta";
      default:
        return "Desconocida";
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
        <View className="flex-row justify-between mt-1">
          <Text className="text-base text-gray-600">
            {getEstadoTexto(item.id_estado)}
          </Text>
          <Text className={`font-Inter-Bold text-lg ${getPrioridadTextColor(item.id_prioridad)}`}>
            {getPrioridadTexto(item.id_prioridad)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {loading ? (
        <Text className="text-center text-gray-600 mt-10">
          Cargando tus reportes...
        </Text>
      ) : incidencias.length === 0 ? (
        <Text className="text-center text-gray-600 mt-10">
          No has registrado ningún reporte todavía
        </Text>
      ) : (
        <FlatList
          data={incidencias}
          renderItem={renderIncidencia}
          keyExtractor={(item) => item.id_incidencia.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View className="absolute bottom-6 left-4 right-4">
        <CustomButton
          label="Crear nuevo reporte"
          onPress={() => router.push("/(user)/reporteincidencia")}
        />
      </View>

      {selectedIncidencia && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleCloseModal}
        >
          <Pressable
            className="flex-1 justify-center items-center bg-black/50 p-4"
            onPress={handleCloseModal}
          >
            <Pressable
              className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md max-h-[80%]"
              onPress={() => {}}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="space-y-2">
                  <Text
                    className="text-3xl text-center font-Inter-Bold text-gray-800 mb-5"
                    numberOfLines={3}
                  >
                    {selectedIncidencia.titulo}
                  </Text>
                  <Text className="text-lg text-gray-700 font-Inter-Bold">
                    Descripcion
                  </Text>
                  <Text className="text-lg font-Inter-Regular  mb-2">
                    {selectedIncidencia.descripcion}
                  </Text>
                  
                  <Text className="text-lg text-gray-700 font-Inter-Bold">
                    Fecha de Creacion
                  </Text>
                  <Text className="text-lg font-Inter-Regular  mb-2">
                    {new Date(
                      selectedIncidencia.fecha_creacion
                    ).toLocaleString("es-MX", { timeZone: 'America/Mexico_City'})}
                  </Text>
                  <Text className="text-lg text-gray-700 font-Inter-Bold">
                    Estado
                  </Text>
                  <Text className="text-lg font-Inter-Regular  mb-2">
                    {getEstadoTexto(selectedIncidencia.id_estado)}
                  </Text>
                  

                  <CustomButton
                    label="Cerrar"
                    color="bg-white"
                    onPress={handleCloseModal}
                    textColor="text-gray-800"
                    borderColor="b-slate-800 border"
                  />
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}