import { supabase } from '@/utils/supabase';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Definición de la interfaz para los datos del equipo a enviar/recibir
interface EquipoFormData {
  nombre: string;
  tipo: string;
  // El estado ahora debe ser el ID (número en la BD), pero lo manejamos como string
  // para la UI del formulario (el valor final a guardar es el ID)
  estado: string; // Guarda el ID del estado seleccionado (ej: '1', '2', '3')
  ubicacion: string;
}

// Definición de la interfaz para los estados de la base de datos
interface Estado {
  id_e: number; // Columna que contiene el ID del estado (asumido: id_e)
  nombre: string; // Nombre legible del estado
}

export default function EquipoForm() {
  const router = useRouter();
  // Obtiene 'id' de los parámetros de la ruta, será 'undefined' si es un nuevo equipo
  const { id } = useLocalSearchParams(); 
  const isEditing = !!id; // Variable booleana para saber si estamos editando
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EquipoFormData>({
    nombre: '',
    tipo: '',
    estado: '', // ID del estado seleccionado (como string)
    ubicacion: '',
  });

  // Lista de estados cargados de la base de datos
  const [estadosList, setEstadosList] = useState<Estado[]>([]);
  // Para controlar la visibilidad del selector de estado (Modal)
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  // --- Lógica de Carga de Datos ---

  // 1. Cargar la lista de estados al iniciar
  useEffect(() => {
    fetchEstados();
  }, []);

  const fetchEstados = async () => {
    try {
      // Consulta la tabla 'estados'. 
      // Se asume que las columnas son 'id_e' y 'nombre'
      const { data, error } = await supabase
        .from('estados')
        .select('id_e, nombre'); 

      if (error) throw error;
      
      if (data) {
        const mappedEstados: Estado[] = data.map((d: any) => ({
          // Aseguramos que el ID sea numérico
          id_e: Number(d.id_e || d.id || d.id_estado),
          nombre: d.nombre || d.name || '',
        }));
        setEstadosList(mappedEstados);
      }
    } catch (error) {
      console.error('Error fetching estados:', error);
      Alert.alert('Error', 'No se pudieron cargar los estados');
    }
  };

  // 2. Cargar equipo si estamos editando
  useEffect(() => {
    // Solo cargamos si estamos editando Y la lista de estados ya se cargó (o no es necesaria para la carga)
    if (isEditing && estadosList.length > 0) {
      loadEquipment(String(id));
    }
  }, [id, isEditing, estadosList]); // Depende de id y estadosList

  const loadEquipment = async (equipoId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipos')
        .select('*')
        .eq('id', equipoId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          nombre: data.nombre || '',
          tipo: data.tipo || '',
          // El ID de estado se convierte a string para el formulario 
          estado: data.estado !== undefined && data.estado !== null ? String(data.estado) : '', 
          ubicacion: data.ubicacion || '',
        });
      }
    } catch (error) {
      console.error('Error loading equipment:', error);
      Alert.alert('Error', 'No se pudo cargar el equipo');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el nombre del estado seleccionado (para mostrar en el campo)
  const getEstadoNombre = (estadoId: string | number) => {
    if (!estadoId) return 'Seleccionar Estado';
    const idNum = Number(estadoId);
    // Busca el estado en la lista cargada
    const estado = estadosList.find(e => e.id_e === idNum); 
    return estado ? estado.nombre : 'Estado Desconocido';
  };


  // --- Lógica de Guardado ---

  const handleSave = async () => {
    // Validación de Nombre
    if (!formData.nombre.trim()) {
      Alert.alert('Validación', 'El nombre es requerido');
      return;
    }
    
    // Convierte el ID de estado (string) a un número o deja null si está vacío/no válido
    const estadoId = formData.estado ? Number(formData.estado) : null;
    
    // Puedes añadir validación de estado si es obligatorio:
    /*
    if (estadoId === null || isNaN(estadoId)) {
      Alert.alert('Validación', 'Debe seleccionar un estado válido.');
      return;
    }
    */

    setLoading(true);
    try {
      // Objeto de datos a enviar
      const dataToSave = {
        nombre: formData.nombre.trim(),
        tipo: formData.tipo.trim() || null,
        // **IMPORTANTE**: Asegúrate de que la columna 'estado' en la DB sea de tipo INTEGER
        estado: estadoId, 
        ubicacion: formData.ubicacion.trim() || null,
      };
      
      let error = null;

      if (isEditing) {
        // Actualizar equipo existente
        const result = await supabase
          .from('equipos')
          .update(dataToSave)
          .eq('id', String(id));
        error = result.error;

        if (error) throw error;
        Alert.alert('Éxito', 'Equipo actualizado correctamente');
      } else {
        // Crear nuevo equipo
        const result = await supabase
          .from('equipos')
          .insert(dataToSave);
        error = result.error;

        if (error) throw error;
        Alert.alert('Éxito', 'Equipo creado correctamente');
      }

      router.back();
    } catch (err: any) {
      console.error('Error saving equipment:', err);
      // Muestra el error específico de Supabase/PostgreSQL
      Alert.alert('Error', err?.message || 'No se pudo guardar el equipo');
    } finally {
      setLoading(false);
    }
  };


  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold">{isEditing ? 'Editar Equipo' : 'Nuevo Equipo'}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="x" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Nombre */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Nombre *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="Ej: Impresora HP M404"
            value={formData.nombre}
            onChangeText={(text) => setFormData({ ...formData, nombre: text })}
            editable={!loading}
          />
        </View>

        {/* Tipo */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Tipo</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="Ej: Impresora, Computadora, Monitor..."
            value={formData.tipo}
            onChangeText={(text) => setFormData({ ...formData, tipo: text })}
            editable={!loading}
          />
        </View>

        {/* Estado (Selector) */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Estado</Text>
          <TouchableOpacity
            className="flex-row justify-between items-center border border-gray-300 rounded-lg p-3"
            onPress={() => setIsPickerVisible(true)}
            disabled={loading}
          >
            <Text className={formData.estado ? 'text-gray-900' : 'text-gray-400'}>
              {getEstadoNombre(formData.estado)}
            </Text>
            <Feather name="chevron-down" size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Ubicación */}
        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-2">Ubicación</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="Ej: Oficina 101, Almacén..."
            value={formData.ubicacion}
            onChangeText={(text) => setFormData({ ...formData, ubicacion: text })}
            editable={!loading}
          />
        </View>

        {/* Botones */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-gray-200 rounded-lg p-3"
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text className="text-center text-gray-700 font-medium">Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 rounded-lg p-3 ${loading ? 'bg-gray-300' : 'bg-blue-500'}`}
            onPress={handleSave}
            disabled={loading}
          >
            <Text className={`text-center font-medium ${loading ? 'text-gray-600' : 'text-white'}`}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Selector de Estado (Sin cambios, ya estaba bien) */}
      <Modal
        visible={isPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} className="items-center justify-end">
          <View className="bg-white w-full rounded-t-xl p-4">
            <Text className="text-xl font-bold mb-4">Selecciona un Estado</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {estadosList.map((estado) => (
                <TouchableOpacity
                  key={estado.id_e}
                  className={`p-4 border-b border-gray-200 ${Number(formData.estado) === estado.id_e ? 'bg-blue-50' : ''}`}
                  onPress={() => {
                    setFormData({ ...formData, estado: String(estado.id_e) });
                    setIsPickerVisible(false);
                  }}
                >
                  <Text className={Number(formData.estado) === estado.id_e ? 'text-blue-600 font-bold' : 'text-gray-800'}>
                    {estado.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              className="mt-4 bg-gray-200 p-3 rounded-lg"
              onPress={() => setIsPickerVisible(false)}
            >
              <Text className="text-center text-gray-700 font-medium">Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}