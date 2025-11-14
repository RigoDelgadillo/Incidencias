import CustomButton from "@/components/CustomButton";
import { supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native"; // Necesario para el listener 'focus'
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";

// --- Definición de la Interfaz ---
interface Incidencia {
  id_incidencia: number;
  titulo: string;
  id_estado: number;
  fecha_creacion: string;
  id_prioridad: number;
  id_usuario: string; 
}

// --- Componente Principal ---
export default function Index() {
  // Asegúrate de usar useNavigation si quieres que la lista se refresque al volver a ella
  const navigation = useNavigation(); 
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Función para cargar las incidencias del usuario desde Supabase
  const getIncidencias = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        Alert.alert("Sesión no encontrada", "Por favor inicia sesión nuevamente.");
        // Opcional: router.replace('/(auth)/login'); 
        return;
      }

      // Obtener las incidencias filtradas por id_usuario
      const { data, error } = await supabase
        .from("incidencias")
        .select("id_incidencia, titulo, id_estado, fecha_creacion, id_prioridad, id_usuario")
        .eq("id_usuario", user.id) 
        .order("fecha_creacion", { ascending: false });

      if (error) throw error;
      setIncidencias(data || []);
    } catch (err: any) {
      Alert.alert("Error", `No se pudieron cargar los reportes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 SOLUCIÓN: Usamos el listener 'focus' para refrescar la lista
  useEffect(() => {
    // Al añadir el listener, debemos devolver una función de limpieza (cleanup function)
    const unsubscribe = navigation.addListener('focus', () => {
      getIncidencias();
    });
    
    // La función de limpieza asegura que el listener se remueva cuando el componente se desmonte
    return unsubscribe;
  }, [navigation]); // navigation es la dependencia

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

  // Renderiza cada elemento de la lista
  const renderIncidencia = ({ item }: { item: Incidencia }) => (
    <TouchableOpacity
      onPress={() => {
        router.push({
          pathname: "/(user)/reportedetalle",
          params: { id: item.id_incidencia },
        });
      }}
      // Ajuste de margen para evitar que se vea demasiado grande
      className={`flex-row items-center justify-between bg-white rounded-xl border-l-4 px-4 py-3 shadow-sm my-2 mx-4 ${getPrioridadColor(
        item.id_prioridad
      )}`}
    >
      <View className="flex-1">
        <Text className="text-xl font-semibold text-gray-900" numberOfLines={1}>
          {item.titulo}
        </Text>
        <Text className="text-base text-gray-600">Estado: {getEstadoTexto(item.id_estado)}</Text>
        <Text className="text-sm text-gray-500">
            Fecha: {new Date(item.fecha_creacion).toLocaleDateString()}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
    </TouchableOpacity>
  );

  // --- Retorno del componente (JSX) ---
  return (
    <View className="flex-1 bg-gray-50">
      {/* Muestra mensajes de estado de carga o vacío */}
      {loading ? (
        <Text className="text-center text-gray-600 mt-10">Cargando tus reportes...</Text>
      ) : incidencias.length === 0 ? (
        <Text className="text-center text-gray-600 mt-10">
          No has registrado ningún reporte todavía
        </Text>
      ) : (
        <FlatList
          data={incidencias}
          renderItem={renderIncidencia}
          keyExtractor={(item) => item.id_incidencia.toString()}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Botón flotante para crear nuevo reporte */}
      <View className="absolute bottom-6 left-4 right-4">
        <CustomButton
          label="Crear nuevo reporte"
          onPress={() => router.push("/reporteincidencia")}
        />
      </View>
    </View>
  );
}