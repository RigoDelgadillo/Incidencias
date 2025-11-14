import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/utils/supabase';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Modal, RefreshControl, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Category {
  id: string;
  name: string;
  raw?: any;
}

export default function CRUDcategorias() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [idColumn, setIdColumn] = useState<string>('id');
  const [modalVisible, setModalVisible] = useState(false);
  // --- CAMPO SIMPLIFICADO ---
  const [formName, setFormName] = useState('');
  // --------------------------
  const [editingId, setEditingId] = useState<string | null>(null);
  const { role } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .limit(500);

      if (error) throw error;

      if (data && Array.isArray(data)) {
        const first = data[0] || {};
        const possibleId = ['id_categoria', 'id', 'id_cat', 'id_c', 'idcategory'];
        const found = possibleId.find((k) => Object.prototype.hasOwnProperty.call(first, k));
        const usedId = found || (Object.keys(first).find((k) => k.toLowerCase().includes('id')) || 'id');
        setIdColumn(usedId);

        const mapped = data.map((d: any) => ({
          id: String(d[usedId] ?? d.id ?? d.id_categoria ?? ''),
          name: d.nombre || d.name || '',
          raw: d,
        }));
        setCategories(mapped);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'No se pudieron obtener las categorías');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [])
  );
  
  // Función para abrir el modal en modo Creación
  const openCreateModal = () => {
    setEditingId(null);
    setFormName('');
    setModalVisible(true);
  };
  
  // Función para abrir el modal en modo Edición
  const openEditModal = (category: Category) => {
    setEditingId(category.id);
    setFormName(category.name);
    setModalVisible(true);
  };

  // Función de Guardar/Actualizar
  const handleSave = async () => {
    if (!formName.trim()) { 
      Alert.alert('Validación', 'El nombre es requerido'); 
      return; 
    }

    setLoading(true);
    try {
      // Payload simplificado, solo incluye 'nombre'
      const payload = { 
        nombre: formName.trim()
      };

      if (editingId) {
        // ACTUALIZACIÓN
        const { error } = await supabase
          .from('categorias')
          .update(payload)
          .eq(idColumn, editingId);
        if (error) throw error;
        Alert.alert('Éxito', 'Categoría actualizada correctamente.');
      } else {
        // CREACIÓN
        const { error } = await supabase
          .from('categorias')
          .insert(payload);
        if (error) throw error;
        Alert.alert('Éxito', 'Categoría creada correctamente.');
      }
      
      setModalVisible(false);
      setEditingId(null);
      setFormName('');
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      // El mensaje de error es más simple ya que 'descripcion' no debería causar problemas.
      Alert.alert('Error', 'No se pudo guardar la categoría.');
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq(idColumn, id);

      if (error) throw error;
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      Alert.alert('Error', 'No se pudo eliminar la categoría');
    }
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      'Eliminar categoría',
      `¿Seguro que deseas eliminar la categoría "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => handleDelete(id) },
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  }, []);

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        
        {/* Header */}
        <View className="flex-row justify-between items-center mb-2 mt-2">
          <Text className="text-2xl font-bold">Categorías</Text>
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
        <View className="flex-row items-center border border-gray-300 rounded-lg p-2 mb-2">
          <Feather name="search" size={20} color="gray" />
          <TextInput 
            className="flex-1 ml-2" 
            placeholder="Buscar categoría..." 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
        </View>

        {/* Categories List */}
        {loading ? (
          <Text className="text-gray-500">Cargando...</Text>
        ) : filteredCategories.length === 0 ? (
          <Text className="text-gray-500">No hay categorías disponibles</Text>
        ) : (
          filteredCategories.map((category) => (
            <View 
              key={category.id} 
              className="flex-row justify-between items-center py-4 border-b border-gray-200"
            >
              <TouchableOpacity 
                className="flex-1"
                onPress={() => {
                  setSelectedCategory(category);
                  setIsDetailModalVisible(true);
                }}
              >
                <Text className="text-lg font-medium">{category.name}</Text>
              </TouchableOpacity>
              <View className="flex-row gap-4">
                {role === 1 && (
                  <>
                    <TouchableOpacity onPress={() => openEditModal(category)}>
                      <Feather name="edit-2" size={20} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(category.id, category.name)}>
                      <Feather name="trash-2" size={20} color="#4B5563" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal de Detalle de Categoría (Solo Nombre) */}
      <Modal
        visible={isDetailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => { setIsDetailModalVisible(false); setSelectedCategory(null); }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} className="items-center justify-center">
          <View style={{ width: '95%', maxWidth: 520 }} className="bg-white rounded-lg p-6">
            <Text className="text-xl font-bold mb-2">Detalle de la categoría</Text>
            {selectedCategory ? (
              <View>
                <Text className="font-medium">Nombre:</Text>
                <Text className="mb-4">{selectedCategory.name}</Text>

                <TouchableOpacity
                  className="bg-blue-500 rounded-lg p-3"
                  onPress={() => { setIsDetailModalVisible(false); setSelectedCategory(null); }}
                >
                  <Text className="text-center text-white font-medium">Cerrar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text>No hay categoría seleccionada</Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal para crear/editar categoría (Solo Nombre) */}
      <Modal 
        visible={modalVisible} 
        transparent 
        animationType="slide" 
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} className="items-center justify-center">
          <View style={{ width: '95%', maxWidth: 420 }} className="bg-white rounded-lg p-6">
            <Text className="text-xl font-bold mb-4">{editingId ? 'Editar Categoría' : 'Nueva Categoría'}</Text>

            {/* Campo Nombre */}
            <Text className="font-medium mb-2">Nombre *</Text>
            <TextInput 
              className="border border-gray-300 rounded-lg p-3 mb-6" 
              placeholder="Ej: Hardware, Software, Servicios" 
              value={formName} 
              onChangeText={setFormName} 
            />

            <View className="flex-row justify-end gap-2">
              <TouchableOpacity 
                className="bg-gray-200 px-4 py-2 rounded-lg" 
                onPress={() => { setModalVisible(false); setEditingId(null); }}
              >
                <Text className="text-gray-700">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`px-4 py-2 rounded-lg ${loading ? 'bg-gray-400' : 'bg-blue-500'}`} 
                onPress={handleSave}
                disabled={loading}
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