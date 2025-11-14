import { useAuth } from '@/providers/AuthProvider';
import { supabase } from "@/utils/supabase";
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';

import { Picker } from '@react-native-picker/picker';
import { Alert, Modal, Platform, RefreshControl, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Interfaz simplificada para Equipos
interface Equipment {
  id: string; // Corresponde a la columna 'id_equipo'
  name: string; // nombre del equipo
  type: string; // Corresponde a la columna 'id_categoria'
}

// Interfaz para Categoría
interface Category {
  id: string; // id_categoria
  name: string; // nombre de la categoría
}

// *** CONFIGURACIÓN FINAL BASADA EN TU IMAGEN DE SUPABASE ***
const EQUIPMENT_ID_COLUMN = 'id_equipo'; // La PK en tu tabla equipos
const EQUIPMENT_CATEGORY_COLUMN = 'id_categoria'; // La FK en tu tabla equipos

export default function CRUDequipos() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { role } = useAuth();

  // --- ESTADOS PARA MODAL DE CREAR/EDITAR ---
  const [modalVisible, setModalVisible] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Lista y Mapa de categorías
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryMap, setCategoryMap] = useState<Map<string, string>>(new Map());
  // ---------------------------------------------------

  // 1. Fetch Categorías
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categorias').select('id_categoria, nombre');
      if (error) throw error;
      
      const map = new Map<string, string>();
      const mappedCategories: Category[] = [];

      if (data && Array.isArray(data)) {
        data.forEach((c: any) => {
          const id = String(c.id_categoria); 
          const nombre = c.nombre || '';
          if (id && nombre) {
            map.set(id, nombre);
            mappedCategories.push({ id, name: nombre });
          }
        });
      }
      setCategories(mappedCategories);
      setCategoryMap(map);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // 2. Fetch Equipos (Usando 'id_equipo' y 'id_categoria')
  const fetchEquipment = async () => {
    setLoading(true);
    try {
      // Se usan las constantes para el SELECT
      const { data, error } = await supabase
        .from('equipos')
        .select(`${EQUIPMENT_ID_COLUMN}, nombre, ${EQUIPMENT_CATEGORY_COLUMN}`) 
        .limit(200);

      if (error) throw error;
      
      if (data) {
        const mapped: Equipment[] = data.map((d: any) => ({
          // Mapeamos el ID real de la base de datos a 'id' de la interfaz
          id: String(d[EQUIPMENT_ID_COLUMN]), 
          name: d.nombre || '',
          // Mapeamos la categoría real de la base de datos a 'type' de la interfaz
          type: String(d[EQUIPMENT_CATEGORY_COLUMN] || ''),
        }));
        setEquipment(mapped);
      } else {
        setEquipment([]);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      Alert.alert('Error', 'No se pudo obtener la lista de equipos');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategories().then(() => {
        fetchEquipment();
      });
    }, [])
  );

  const resolveCategoryLabel = (typeId: string): string => {
    return categoryMap.get(typeId) || 'Sin Categoría';
  };

  // --- Funciones del Modal CRUD ---

  const openCreateModal = () => {
    setEditingId(null);
    setFormName('');
    setFormCategory(categories[0]?.id || ''); 
    setModalVisible(true);
  };
  
  const openEditModal = (item: Equipment) => {
    setEditingId(item.id);
    setFormName(item.name);
    const initialCategory = item.type && categoryMap.has(item.type) ? item.type : (categories[0]?.id || '');
    setFormCategory(initialCategory); 
    setModalVisible(true);
  };
  
  // Guardar (Crear/Editar)
  const handleSave = async () => {
    if (!formName.trim() || !formCategory) { 
      Alert.alert('Validación', 'El nombre y la categoría son requeridos'); 
      return; 
    }

    setLoading(true);
    try {
      // Creamos el payload dinámicamente usando las constantes
      const payload: { [key: string]: any } = { 
        nombre: formName.trim(),
      };
      payload[EQUIPMENT_CATEGORY_COLUMN] = formCategory ? Number(formCategory) : null; 

      if (editingId) {
        // ACTUALIZACIÓN: Usamos EQUIPMENT_ID_COLUMN para la condición .eq()
        const { error } = await supabase
          .from('equipos')
          .update(payload)
          .eq(EQUIPMENT_ID_COLUMN, editingId); 
        if (error) throw error;
        Alert.alert('Éxito', 'Equipo actualizado correctamente.');
      } else {
        // CREACIÓN
        const { error } = await supabase
          .from('equipos')
          .insert(payload);
        if (error) throw error;
        Alert.alert('Éxito', 'Equipo creado correctamente.');
      }
      
      setModalVisible(false);
      fetchEquipment(); 
    } catch (err) {
      console.error('Error saving equipment:', err);
      Alert.alert('Error', 'No se pudo guardar el equipo. Verifique los nombres de las columnas: id_equipo y id_categoria.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      // Eliminación: Usamos EQUIPMENT_ID_COLUMN para la condición .eq()
      const { error } = await supabase
        .from('equipos')
        .delete()
        .eq(EQUIPMENT_ID_COLUMN, id);

      if (error) throw error;
      Alert.alert('Éxito', 'Equipo eliminado correctamente.');
      await fetchEquipment();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      Alert.alert('Error', 'No se pudo eliminar el equipo');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      'Eliminar equipo',
      `¿Seguro que deseas eliminar el equipo "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => handleDelete(id) },
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCategories();
    await fetchEquipment();
    setRefreshing(false);
  }, []);

  // Filtrado por nombre de equipo o nombre de categoría
  const filteredEquipment = equipment.filter(item => {
    const categoryName = resolveCategoryLabel(item.type);
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4" refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
        
        {/* Header */}
        <View className="flex-row justify-between items-center mb-2 mt-2">
          <Text className="text-2xl font-bold">Equipos</Text>
          {/* Botón de Añadir (solo Admin) */}
          {role === 1 && (
            <TouchableOpacity 
              className="bg-blue-500 rounded-full w-10 h-10 items-center justify-center"
              onPress={openCreateModal}
            >
              <Feather name="plus" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center border border-gray-300 rounded-lg p-2 mb-4">
          <Feather name="search" size={20} color="gray" />
          <TextInput 
            className="flex-1 ml-2"
            placeholder="Buscar por nombre o categoría..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Equipment List */}
        {loading && !refreshing ? (
          <Text className="text-gray-500">Cargando...</Text>
        ) : filteredEquipment.length === 0 ? (
          <Text className="text-gray-500">No hay equipos disponibles</Text>
        ) : (
          filteredEquipment.map((item) => (
            <View 
              key={item.id}
              className="flex-row justify-between items-center py-4 border-b border-gray-200"
            >
              <View className="flex-1">
                <Text className="text-lg font-medium">{item.name}</Text>
                {/* Muestra el nombre legible de la categoría */}
                <Text className="text-gray-500">Categoría: **{resolveCategoryLabel(item.type)}**</Text> 
              </View>
              <View className="flex-row gap-4">
                {/* Botones de acción (solo Admin) */}
                {role === 1 && (
                  <>
                    <TouchableOpacity onPress={() => openEditModal(item)}>
                      <Feather name="edit-2" size={20} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(item.id, item.name)}>
                      <Feather name="trash-2" size={20} color="#4B5563" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal para crear/editar equipo (Nombre y Categoría) */}
      <Modal 
        visible={modalVisible} 
        transparent 
        animationType="slide" 
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} className="items-center justify-center">
          <View style={{ width: '95%', maxWidth: 420 }} className="bg-white rounded-lg p-6">
            <Text className="text-xl font-bold mb-4">{editingId ? 'Editar Equipo' : 'Nuevo Equipo'}</Text>

            {/* Campo Nombre */}
            <Text className="font-medium mb-2">Nombre *</Text>
            <TextInput 
              className="border border-gray-300 rounded-lg p-3 mb-4" 
              placeholder="Ej: Laptop, Monitor, Impresora" 
              value={formName} 
              onChangeText={setFormName} 
            />

            {/* Selector de Categoría */}
            <Text className="font-medium mb-2">Categoría *</Text>
            <View className={`border border-gray-300 rounded-lg mb-6 ${Platform.OS === 'ios' ? 'p-0' : 'p-0'}`}>
              <Picker
                selectedValue={formCategory}
                onValueChange={(itemValue) => setFormCategory(itemValue)}
                style={{ height: Platform.OS === 'ios' ? 150 : 50, width: '100%' }}
              >
                {/* Asegura que haya categorías para mostrar */}
                {categories.length === 0 ? (
                  <Picker.Item label="Cargando categorías..." value="" />
                ) : (
                  categories.map((cat) => (
                    <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                  ))
                )}
              </Picker>
            </View>

            <View className="flex-row justify-end gap-2">
              <TouchableOpacity 
                className="bg-gray-200 px-4 py-2 rounded-lg" 
                onPress={() => { setModalVisible(false); setEditingId(null); setFormName(''); setFormCategory(''); }}
              >
                <Text className="text-gray-700">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`px-4 py-2 rounded-lg ${loading || categories.length === 0 ? 'bg-gray-400' : 'bg-blue-500'}`} 
                onPress={handleSave}
                disabled={loading || categories.length === 0}
              >
                <Text className="text-white font-medium">
                  {loading ? 'Guardando...' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}