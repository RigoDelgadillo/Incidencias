import CustomButton from "@/components/CustomButton";
import { supabase } from "@/utils/supabase";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";

interface Creador {
  nombre: string;
  apellido: string;
}

// 1. Interfaz Simple (para la lista)
interface IncidenciaSimple {
  id_incidencia: number;
  titulo: string;
  descripcion: string;
  id_estado: number;
  fecha_creacion: string;
  id_prioridad: number;
  id_usuario: string; // <-- CORRECCIÓN: De 'creado_por' a 'id_usuario'
}

// 2. Interfaz Completa (para el modal)
interface IncidenciaFull extends Omit<IncidenciaSimple, 'id_usuario'> {
  usuarios: Creador[]; 
}


export default function Index() {
  const navigation = useNavigation();
  const [incidencias, setIncidencias] = useState<IncidenciaSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIncidencia, setSelectedIncidencia] = useState<IncidenciaFull | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false); 

  const getIncidencias = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        Alert.alert("Sesión no encontrada", "Por favor inicia sesión nuevamente.");
        return;
      }

      // 1. Obtenemos IDs de la tabla "asignaciones"
      const { data: asignaciones, error: asignError } = await supabase
        .from("asignaciones") 
        .select("id_incidencia")
        .eq("id_tecnico", user.id); 

      if (asignError) throw asignError;

      if (!asignaciones || asignaciones.length === 0) {
        setIncidencias([]);
        setLoading(false); 
        return; 
      }

      const incidenciaIds = asignaciones.map((a) => a.id_incidencia);

      const { data, error } = await supabase
        .from("incidencias")
        .select(`
          id_incidencia, 
          titulo, 
          id_estado, 
          fecha_creacion, 
          id_prioridad, 
          descripcion, 
          id_usuario 
        `) // <-- CORRECCIÓN: De 'creado_por' a 'id_usuario'
        .in("id_incidencia", incidenciaIds) 
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

  const handleOpenModal = async (incidencia: IncidenciaSimple) => {
    setModalVisible(true);
    setLoadingModal(true); 

    try {
      // 1. Hacemos la consulta para traer el nombre del creador
      const { data: creadorData, error: creadorError } = await supabase
        .from("usuarios") 
        .select("nombre, apellido")
        // <-- CORRECCIÓN: Comparamos con 'incidencia.id_usuario'
        .eq("id_usuario", incidencia.id_usuario); 
      
      if (creadorError) throw creadorError;

      // 2. Unimos los datos
      const incidenciaCompleta: IncidenciaFull = {
        ...incidencia, 
        usuarios: creadorData || [], 
      };

      // 3. Guardamos la incidencia completa en el estado
      setSelectedIncidencia(incidenciaCompleta);

    } catch (err: any) {
      Alert.alert("Error", `No se pudo cargar la información del creador: ${err.message}`);
      handleCloseModal(); // Cerramos si hay un error
    } finally {
      setLoadingModal(false); 
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedIncidencia(null);
    setLoadingModal(false);
  };

  const handleCompletarTarea = async () => {
    if (isUpdating || !selectedIncidencia) return; 

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("incidencias")
        .update({ id_estado: 3 }) 
        .eq("id_incidencia", selectedIncidencia.id_incidencia);

      if (error) throw error;

      Alert.alert("¡Éxito!", "La tarea ha sido marcada como resuelta.");

      setIncidencias(prevIncidencias =>
        prevIncidencias.map(inc =>
          inc.id_incidencia === selectedIncidencia.id_incidencia
            ? { ...inc, id_estado: 3 }
            : inc
        )
      );

      handleCloseModal(); 

    } catch (err: any) {
      Alert.alert("Error", `No se pudo actualizar la tarea: ${err.message}`);
    } finally {
      setIsUpdating(false); 
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

  const getPrioridadTextColor = (id_prioridad: number) => {
    switch (id_prioridad) {
      case 1:
        return "text-green-500"; 
      case 2:
        return "text-yellow-500"; 
      case 3:
        return "text-red-500"; 
      default:
        return "text-gray-300"; 
    }
  };

  const renderIncidencia = ({ item }: { item: IncidenciaSimple }) => (
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
        <Text className="text-center text-gray-600 mt-10">Cargando tus reportes...</Text>
      ) : incidencias.length === 0 ? (
        <Text className="text-center text-gray-600 mt-10">
          No tienes reportes asignados.
        </Text>
      ) : (
        <FlatList
          data={incidencias}
          renderItem={renderIncidencia}
          keyExtractor={(item) => item.id_incidencia.toString()}
          showsVerticalScrollIndicator={false}
        />
      )}

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
            {loadingModal ? (
              <View className="h-64 justify-center items-center">
                <ActivityIndicator size="large" color="#4B5563" />
                <Text className="text-gray-600 mt-3">Cargando detalles...</Text>
              </View>
            ) : selectedIncidencia && (
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
                  <Text className="text-lg font-Inter-Regular mb-2">
                    {selectedIncidencia.descripcion}
                  </Text>
                  <Text className="text-lg text-gray-700 font-Inter-Bold">
                    Creado por
                  </Text>
                  <Text className="text-lg font-Inter-Regular mb-2">
                    {selectedIncidencia.usuarios &&
                    selectedIncidencia.usuarios.length > 0
                      ? `${selectedIncidencia.usuarios[0].nombre} ${selectedIncidencia.usuarios[0].apellido}`
                      : "Usuario desconocido"}
                  </Text>
                  <Text className="text-lg text-gray-700 font-Inter-Bold">
                    Fecha de Creacion
                  </Text>
                  <Text className="text-lg font-Inter-Regular mb-2">
                    {new Date(
                      selectedIncidencia.fecha_creacion
                    ).toLocaleString("es-ES")}
                  </Text>
                  <Text className="text-lg text-gray-700 font-Inter-Bold">
                    Estado
                  </Text>
                  <Text className="text-lg font-Inter-Regular mb-2">
                    {getEstadoTexto(selectedIncidencia.id_estado)}
                  </Text>

                  <CustomButton
                    label="Marcar como Resuelta"
                    color="bg-green-500"
                    onPress={handleCompletarTarea}
                  />
                  <CustomButton
                    label="Cerrar"
                    color="bg-white"
                    onPress={handleCloseModal}
                    textColor="text-gray-800"
                    borderColor="b-slate-800 border"
                  />
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}