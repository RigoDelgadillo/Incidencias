import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";

import { supabase } from "@/utils/supabase";

interface Incidencia {
  id_incidencia: number;
  titulo: string;
  descripcion: string;
  fecha_creacion: string;
  id_equipo: number;
  id_estado: number;
  id_prioridad: number;
  creado_por: string;
  imagen: string | null;
}

export default function homeadminScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
    const [loading, setLoading] = useState(true);

    const getIncidencias = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("incidencias")
                .select(`
                    id_incidencia,
                    titulo,
                    descripcion,
                    fecha_creacion,
                    id_equipo,
                    id_estado,
                    id_prioridad,
                    creado_por,
                    imagen
                `);

            if (error) throw error;

            setIncidencias(data || []);
        } catch (err: any) {
            Alert.alert("Error", `No se pudieron cargar las incidencias: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getIncidencias();
    }, []);

    const handlePress = (incidencia: Incidencia) => {
        Alert.alert(
            incidencia.titulo,
            `Descripción: ${incidencia.descripcion}\n\nEquipo: ${incidencia.id_equipo}\nPrioridad: ${getPrioridadText(incidencia.id_prioridad)}\nFecha: ${incidencia.fecha_creacion}`,
            [{ text: "Cerrar", onPress: () => {} }]
        );
    };

    const handleGoBack = () => {
        navigation.goBack(); 
    };

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

    const getPrioridadText = (id_prioridad: number) => {
        switch (id_prioridad) {
            case 1:
                return "Alta";
            case 2:
                return "Media";
            case 3:
                return "Baja";
            default:
                return "Desconocida";
        }
    };

    const renderIncidencia = ({ item }: { item: Incidencia }) => (
        <TouchableOpacity
            onPress={() => handlePress(item)}
            className={`flex-row items-center justify-between bg-white rounded-xl border-l-4 px-4 py-3 shadow-sm my-2 mx-4 ${getPrioridadColor(item.id_prioridad)}`}
        >
            <View className="flex-1">
                <Text className="text-base font-Inter-Bold text-gray-900">
                    {item.titulo}
                </Text>
                <Text className="text-sm text-gray-600">
                    {item.descripcion.substring(0, 50)}...
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                    Prioridad: {getPrioridadText(item.id_prioridad)}
                </Text>
            </View>

            <Ionicons name="chevron-forward" size={22} color="black" />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1">
            <View className="mx-auto mt-5 mb-6">
                <Text 
                    className="text-center text-3xl font-Inter-Bold mt-10"
                >
                    Todos los Reportes
                </Text>
            </View>
            
            {loading ? (
                <Text className="text-center text-gray-600 mt-10">Cargando incidencias...</Text>
            ) : incidencias.length === 0 ? (
                <Text className="text-center text-gray-600 mt-10">No hay incidencias registradas</Text>
            ) : (
                <FlatList
                    data={incidencias}
                    renderItem={renderIncidencia}
                    keyExtractor={(item) => item.id_incidencia.toString()}
                    scrollEnabled={true}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    );
}