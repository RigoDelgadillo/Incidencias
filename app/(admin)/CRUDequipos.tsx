import { useAuth } from '@/providers/AuthProvider';
import { supabase } from "@/utils/supabase";
import { Feather } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
// ¡Importaciones críticas para la compilación! Se incluye 'TextInput'
import { Alert, Modal, RefreshControl, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Equipment {
  id: string;
  name: string; // nombre
  type?: string; // tipo
  status?: string; // estado - Contiene el ID numérico del estado
  location?: string; // ubicacion
  created_at?: string; // para ordenamiento por fecha
}

interface Estado {
  id_e: number;
  nombre: string;
}

export default function CRUDequipos() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const { role } = useAuth();
  const [sortOption, setSortOption] = useState<'A-Z' | 'Z-A' | 'oldest' | 'newest'>('A-Z');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [estadosMap, setEstadosMap] = useState<Map<number, string>>(new Map()); 

  // Función para obtener todos los estados y guardarlos en un mapa
  const fetchEstados = async () => {
    try {
      // Consulta con columnas 'id_e' y 'nombre' (coincide con tu imagen)
      const { data, error } = await supabase.from('estados').select('id_e, nombre');
      if (error) throw error;
      
      const map = new Map<number, string>();
      if (data && Array.isArray(data)) {
        data.forEach((e: any) => {
          // Usamos Number(e.id_e) para asegurar que la clave sea numérica
          const id = Number(e.id_e); 
          const nombre = e.nombre || '';
          if (!isNaN(id) && nombre) {
            map.set(id, nombre);
          }
        });
      }
      setEstadosMap(map);
    } catch (err) {
      console.error('Error fetching estados:', err);
    }
  };

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipos')
        .select('*')
        .limit(200);

      if (error) throw error;
      
      if (data) {
        const mapped = data.map((d: any) => ({
          id: String(d.id),
          name: d.nombre || d.name || '',
          type: d.tipo || d.type || '',
          // Lee el ID de la columna 'estado'
          status: d.estado !== undefined && d.estado !== null ? String(d.estado) : '', 
          location: d.ubicacion || d.location || '',
          created_at: d.created_at || d.fecha_creacion || '',
        }));
        setEquipment(mapped);
        
        // Extraer tipos únicos para el filtro
        const tipos = Array.from(new Set(mapped.map((m: any) => (m.type || '').toString()).filter(Boolean)));
        setEquipmentTypes(tipos);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      Alert.alert('Error', 'No se pudo obtener la lista de equipos');
    } finally {
      setLoading(false);
    }
  };

  // 🔄 useFocusEffect para refrescar datos al entrar a la pantalla
  useFocusEffect(
    useCallback(() => {
      // 1. Cargamos estados
      fetchEstados().then(() => {
        // 2. Cargamos equipos solo después de tener los estados
        fetchEquipment();
      });
    }, [])
  );
  
  // --- Funciones reincorporadas para que compile ---

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('equipos')
        .delete()
        .eq('id', id);

      if (error) throw error;
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
    await fetchEstados();
    await fetchEquipment();
    setRefreshing(false);
  }, []);

  const sortEquipment = (items: Equipment[]) => {
    const sorted = [...items];
    
    if (sortOption === 'A-Z') {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortOption === 'Z-A') {
      sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sortOption === 'oldest') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateA - dateB;
      });
    } else if (sortOption === 'newest') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
    }
    
    return sorted;
  };

  const getSortLabel = () => {
    switch (sortOption) {
      case 'A-Z':
        return 'A-Z';
      case 'Z-A':
        return 'Z-A';
      case 'oldest':
        return 'Más antiguos';
      case 'newest':
        return 'Más recientes';
      default:
        return 'Ordenar';
    }
  };
  // --- Fin Funciones reincorporadas ---
  
  // 🏷️ Resuelve el ID de estado a su nombre legible usando el mapa
  const resolveEstadoLabel = (status: any) => {
    if (status === undefined || status === null || status === '') return '-';
    const asNumber = Number(status);
    // Busca en el mapa el ID numérico
    if (!isNaN(asNumber) && estadosMap.has(asNumber)) { 
      return estadosMap.get(asNumber) || String(status);
    }
    // Si no es un id numérico o no está en el mapa, devuelve un guion
    return '-'; 
  };

  // Filtrado y Ordenamiento (se asegura de usar el label resuelto para la búsqueda)
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      // Permite buscar por el nombre legible del estado
      resolveEstadoLabel(item.status).toLowerCase().includes(searchQuery.toLowerCase()); 

    const matchesType = selectedType ? (item.type || '') === selectedType : true;

    return matchesSearch && matchesType;
  });

  const sortedAndFilteredEquipment = sortEquipment(filteredEquipment);


  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4" refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-2 mt-2">
          <Text className="text-2xl font-bold">Equipos</Text>
          {/* Solo muestra el botón de añadir si el rol es 1 (Admin) */}
          {role === 1 && (
            <Link href="/(admin)/EquipoForm" asChild>
              <TouchableOpacity 
                className="bg-blue-500 rounded-full w-10 h-10 items-center justify-center"
              >
                <Feather name="plus" size={24} color="white" />
              </TouchableOpacity>
            </Link>
          )}
        </View>

        {/* Search Bar and Sort Button */}
        <View className="flex-row gap-2 mb-2">
          <View className="flex-1 flex-row items-center border border-gray-300 rounded-lg p-2">
            <Feather name="search" size={20} color="gray" />
            <TextInput // ¡Se requiere el import de TextInput!
              className="flex-1 ml-2"
              placeholder="Buscar..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            className="bg-blue-100 px-4 py-2 rounded-lg justify-center"
            onPress={() => setShowSortMenu(true)}
          >
            <Text className="text-blue-500 font-medium text-sm">{getSortLabel()}</Text>
          </TouchableOpacity>
        </View>

        {/* Filter by Type */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row items-center space-x-2">
            {/* Opción para quitar el filtro */}
            <TouchableOpacity
              className={`px-3 py-2 rounded-lg ${selectedType === null ? 'bg-blue-500' : 'bg-gray-100'}`}
              onPress={() => setSelectedType(null)}
            >
              <Text className={`${selectedType === null ? 'text-white' : 'text-blue-500'}`}>Todos</Text>
            </TouchableOpacity>

            {/* Filtros de Tipo */}
            {equipmentTypes.map((t) => (
              <TouchableOpacity
                key={t}
                className={`px-3 py-2 rounded-lg ${selectedType === t ? 'bg-blue-500' : 'bg-gray-100'}`}
                onPress={() => setSelectedType(selectedType === t ? null : t)}
              >
                <Text className={`${selectedType === t ? 'text-white' : 'text-blue-500'}`}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Equipment List */}
        {loading && !refreshing ? (
          <Text className="text-gray-500">Cargando...</Text>
        ) : sortedAndFilteredEquipment.length === 0 ? (
          <Text className="text-gray-500">No hay equipos disponibles</Text>
        ) : (
          sortedAndFilteredEquipment.map((item) => (
            <View 
              key={item.id}
              className="flex-row justify-between items-center py-4 border-b border-gray-200"
            >
              <TouchableOpacity className="flex-1" onPress={() => { setSelectedEquipment(item); setIsModalVisible(true); }}>
                <Text className="text-lg font-medium">{item.name}</Text>
                <Text className="text-gray-500">{item.type}</Text>
                {/* 🎯 Muestra el nombre legible del estado: Nuevo, En proceso, Resuelto */}
                <Text className="text-gray-500">Estado: **{resolveEstadoLabel(item.status)}**</Text> 
                {item.location && (
                  <Text className="text-gray-500">Ubicación: {item.location}</Text>
                )}
              </TouchableOpacity>
              <View className="flex-row gap-4">
                {/* Solo muestra los botones de edición y eliminación si el rol es 1 (Admin) */}
                {role === 1 && (
                  <>
                    <Link href={{ pathname: '/(admin)/EquipoForm', params: { id: item.id } }} asChild>
                      <TouchableOpacity>
                        <Feather name="edit-2" size={20} color="#4B5563" />
                      </TouchableOpacity>
                    </Link>
                    <TouchableOpacity onPress={() => confirmDelete(item.id, item.name)}>
                      <Feather name="trash-2" size={20} color="#4B5563" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}

        {/* Sort Modal */}
        <Modal
          visible={showSortMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSortMenu(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} className="items-center justify-center">
            <View style={{ width: '90%', maxWidth: 360 }} className="bg-white rounded-lg p-6">
              <Text className="text-lg font-bold mb-4">Ordenar por:</Text>

              <TouchableOpacity
                className={`p-3 rounded-lg mb-2 ${sortOption === 'A-Z' ? 'bg-blue-500' : 'bg-gray-100'}`}
                onPress={() => {
                  setSortOption('A-Z');
                  setShowSortMenu(false);
                }}
              >
                <Text className={sortOption === 'A-Z' ? 'text-white' : 'text-gray-700'}>A - Z</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`p-3 rounded-lg mb-2 ${sortOption === 'Z-A' ? 'bg-blue-500' : 'bg-gray-100'}`}
                onPress={() => {
                  setSortOption('Z-A');
                  setShowSortMenu(false);
                }}
              >
                <Text className={sortOption === 'Z-A' ? 'text-white' : 'text-gray-700'}>Z - A</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`p-3 rounded-lg mb-2 ${sortOption === 'oldest' ? 'bg-blue-500' : 'bg-gray-100'}`}
                onPress={() => {
                  setSortOption('oldest');
                  setShowSortMenu(false);
                }}
              >
                <Text className={sortOption === 'oldest' ? 'text-white' : 'text-gray-700'}>Más antiguos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`p-3 rounded-lg mb-4 ${sortOption === 'newest' ? 'bg-blue-500' : 'bg-gray-100'}`}
                onPress={() => {
                  setSortOption('newest');
                  setShowSortMenu(false);
                }}
              >
                <Text className={sortOption === 'newest' ? 'text-white' : 'text-gray-700'}>Más recientes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-gray-200 p-3 rounded-lg"
                onPress={() => setShowSortMenu(false)}
              >
                <Text className="text-center text-gray-700 font-medium">Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Detail modal for selected equipment */}
        <Modal
          visible={isModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => { setIsModalVisible(false); setSelectedEquipment(null); }}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} className="items-center justify-center">
            <View style={{ width: '95%', maxWidth: 520 }} className="bg-white rounded-lg p-6">
              <Text className="text-xl font-bold mb-2">Detalle del equipo</Text>
              {selectedEquipment ? (
                <View>
                  <Text className="font-medium">Nombre:</Text>
                  <Text className="mb-2">{selectedEquipment.name}</Text>

                  <Text className="font-medium">Tipo:</Text>
                  <Text className="mb-2">{selectedEquipment.type}</Text>

                  <Text className="font-medium">Estado:</Text>
                  {/* Muestra el nombre del estado en el modal de detalle */}
                  <Text className="mb-2">{resolveEstadoLabel(selectedEquipment.status)}</Text> 

                  <Text className="font-medium">Ubicación:</Text>
                  <Text className="mb-4">{selectedEquipment.location || '-'}</Text>

                  <TouchableOpacity
                    className="bg-blue-500 rounded-lg p-3"
                    onPress={() => { setIsModalVisible(false); setSelectedEquipment(null); }}
                  >
                    <Text className="text-center text-white font-medium">Cerrar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text>No hay equipo seleccionado</Text>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}