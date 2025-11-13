import { supabase } from "@/utils/supabase";
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Link } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';


interface User {
  id: string;
  name: string;
  lastName: string;
  phone: string;
  role: string;
  roleDescription?: string;
}

export default function CRUDUsuarios() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetchInfo, setLastFetchInfo] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [idColumn, setIdColumn] = useState<string>('id');
  
  // Opciones de roles para filtro
  const roleOptions = ['Administrador', 'Usuario', 'Técnico'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Obtener usuarios
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*')
        .limit(100);

      console.log('Primer usuario:', usuariosData?.[0]);

      // Detectar dinámicamente cuál es la columna ID
      if (usuariosData && usuariosData.length > 0) {
        const first = usuariosData[0];
        const possibleId = ['id', 'id_usuario', 'id_user', 'uid', 'user_id'];
        const found = possibleId.find((k) => Object.prototype.hasOwnProperty.call(first, k));
        const usedId = found || (Object.keys(first).find((k) => k.toLowerCase().includes('id')) || 'id');
        setIdColumn(usedId);
        console.log('ID column detected:', usedId);
      }

      // No necesitamos consultar roles ya que usaremos valores fijos
      const rolesError = null;
      setLastFetchInfo(JSON.stringify({ 
        usuarios: { 
          source: 'usuarios', 
          data: usuariosData, 
          error: usuariosError,
          timestamp: new Date().toISOString()
        },
      }, null, 2));
      
      console.log('Fetch responses:', { 
        usuarios: { data: usuariosData, error: usuariosError }
      });

      if (usuariosError) {
        console.error('Error al obtener usuarios:', usuariosError);
        throw usuariosError;
      }

      if (rolesError) {
        console.error('Error al obtener roles:', rolesError);
        throw rolesError;
      }

      // Crear mapa de roles con valores fijos según la estructura de la BD
      const rolesMap = new Map([
        [1, { nombre: 'Administrador' }],
        [2, { nombre: 'Usuario' }],
        [3, { nombre: 'Técnico' }]
      ]);

      if (usuariosData && Array.isArray(usuariosData)) {
        if (usuariosData.length > 0) {
          // Detectar dinámicamente cuál es la columna ID para guardarla
          const first = usuariosData[0];
          const possibleId = ['id', 'id_usuario', 'id_user', 'uid', 'user_id'];
          const foundId = possibleId.find((k) => Object.prototype.hasOwnProperty.call(first, k));
          const detectedIdColumn = foundId || (Object.keys(first).find((k) => k.toLowerCase().includes('id')) || 'id');
          setIdColumn(detectedIdColumn);

          // Mapear usuarios con roles fijos
          const mapped = usuariosData.map((usuario, index) => {
            // Convertir el rol_id a número para buscar en el mapa
            const rolId = parseInt(usuario.rol_id || usuario.role_id || usuario.id_rol || '0', 10);
            const rol = rolesMap.get(rolId);
            
            console.log('Debug usuario:', {
              usuarioId: usuario[detectedIdColumn],
              nombre: usuario.nombre,
              rolId: rolId,
              rolAsignado: rol?.nombre || 'Sin rol'
            });

            return {
              id: String(usuario[detectedIdColumn] || usuario.id || usuario.user_id || `temp-${index}`), 
              name: usuario.nombre || usuario.first_name || usuario.name || '',
              lastName: usuario.apellido || usuario.last_name || usuario.apellidos || '',
              phone: usuario.telefono || usuario.phone || usuario.tel || '',
              role: rol?.nombre || 'Sin rol asignado'
            };
          });
          setUsers(mapped);
        } else {
          console.log('[fetchUsers] no users found');
          setUsers([]);
          Alert.alert(
            'Información',
            'No se encontraron usuarios en la base de datos.'
          );
        }
      } else {
        console.error('[fetchUsers] invalid response format');
        Alert.alert(
          'Error',
          'La respuesta del servidor no tiene el formato esperado.'
        );
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'No se pudieron obtener los usuarios. Revisa la conexión o permisos (RLS/policies).');
    } finally {
      setLoading(false);
    }
  };

  // Refetch when the screen is focused (useful after navigating back from a form)
  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq(idColumn, id);

      if (error) throw error;
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert('Error', 'No se pudo eliminar el usuario.');
    }
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      'Eliminar usuario',
      `¿Seguro que deseas eliminar a ${name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => handleDelete(id) },
      ]
    );
  };

  // Filtrar usuarios por búsqueda y por rol seleccionado
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter ? user.role === selectedRoleFilter : true;
    return matchesSearch && matchesRole;
  });

  // Obtener etiqueta para el botón de filtro
  const getFilterLabel = () => {
    return selectedRoleFilter ? selectedRoleFilter : 'Todos';
  };

  return (
    <View className="flex-1 bg-white p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View className="flex-row items-center">
          <Text className="text-2xl font-bold">Gestión de Usuarios</Text>
          <TouchableOpacity 
            className="ml-2 bg-gray-100 rounded-full p-2"
            onPress={() => {
              if (lastFetchInfo) {
                Alert.alert('Debug Info', lastFetchInfo);
              } else {
                Alert.alert('Debug Info', 'No hay información de la última consulta');
              }
            }}
          >
            <Feather name="info" size={16} color="#666" />
          </TouchableOpacity>
        </View>
        {/* Link hacia el formulario para crear usuario */}
        <Link href="/(admin)/UsuarioForm" asChild>
          <TouchableOpacity 
            className="bg-blue-500 rounded-full w-10 h-10 items-center justify-center"
          >
            <Feather name="plus" size={24} color="white" />
          </TouchableOpacity>
        </Link>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center border border-gray-300 rounded-lg p-2 mb-4">
        <Feather name="search" size={20} color="gray" />
        <TextInput
          className="flex-1 ml-2"
          placeholder="Buscar..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Button */}
      <View className="mb-4">
        <TouchableOpacity 
          className="bg-blue-100 px-4 py-2 rounded-lg"
          onPress={() => setShowFilterMenu(true)}
        >
          <Text className="text-blue-500">Filtrar: {getFilterLabel()}</Text>
        </TouchableOpacity>
      </View>

      {/* Users List */}
      <Text className="text-xl font-semibold mb-4">Usuarios</Text>
      <ScrollView className="flex-1" refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
        {loading ? (
          <Text className="text-gray-500">Cargando...</Text>
        ) : filteredUsers.length === 0 ? (
          <Text className="text-gray-500">No hay usuarios disponibles.</Text>
        ) : (
          filteredUsers.map((user) => (
            <View 
              key={user.id}
              className="flex-row justify-between items-center py-4 border-b border-gray-200"
            >
              <TouchableOpacity 
                className="flex-1 mr-4"
                onPress={() => {
                  setSelectedUser(user);
                  setIsModalVisible(true);
                }}
              >
                <Text className="text-lg font-medium">{`${user.name} ${user.lastName}`.trim()}</Text>
                <Text className="text-gray-500">{user.role}</Text>
              </TouchableOpacity>
              <View className="flex-row gap-4">
                {/* Link hacia el formulario para editar (pasa id como query param) */}
                <Link href={{ pathname: '/(admin)/UsuarioForm', params: { id: user.id } }} asChild>
                  <TouchableOpacity>
                    <Feather name="edit-2" size={20} color="#4B5563" />
                  </TouchableOpacity>
                </Link>
                <TouchableOpacity onPress={() => confirmDelete(user.id, user.name)}>
                  <Feather name="trash-2" size={20} color="#4B5563" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal de Detalle de Usuario */}
      {isModalVisible && selectedUser && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <View className="bg-white rounded-xl p-6 m-4 w-[90%] max-w-md">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">Detalle del Usuario</Text>
              <TouchableOpacity 
                onPress={() => {
                  setIsModalVisible(false);
                  setSelectedUser(null);
                }}
                className="p-2"
              >
                <Feather name="x" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-gray-500 text-sm">Nombre</Text>
                <Text className="text-gray-800 font-medium">{selectedUser.name}</Text>
              </View>

              <View>
                <Text className="text-gray-500 text-sm">Apellido</Text>
                <Text className="text-gray-800 font-medium">{selectedUser.lastName}</Text>
              </View>

              <View>
                <Text className="text-gray-500 text-sm">Teléfono</Text>
                <Text className="text-gray-800 font-medium">{selectedUser.phone || 'No especificado'}</Text>
              </View>

              <View>
                <Text className="text-gray-500 text-sm">Rol</Text>
                <Text className="text-gray-800 font-medium">{selectedUser.role}</Text>
                {selectedUser.roleDescription && (
                  <Text className="text-gray-600 text-sm mt-1 italic">{selectedUser.roleDescription}</Text>
                )}
              </View>

              <View className="flex-row justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <TouchableOpacity 
                  className="px-4 py-2 rounded-lg bg-gray-100"
                  onPress={() => {
                    setIsModalVisible(false);
                    setSelectedUser(null);
                  }}
                >
                  <Text className="text-gray-600">Cerrar</Text>
                </TouchableOpacity>
                
                <Link href={{ pathname: '/(admin)/UsuarioForm', params: { id: selectedUser.id } }} asChild>
                  <TouchableOpacity className="px-4 py-2 rounded-lg bg-blue-500">
                    <Text className="text-white">Editar</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Modal de Filtro por Rol */}
      <Modal
        visible={showFilterMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterMenu(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} className="items-center justify-center">
          <View style={{ width: '90%', maxWidth: 360 }} className="bg-white rounded-lg p-6">
            <Text className="text-lg font-bold mb-4">Filtrar por Rol:</Text>

            {/* Opción: Todos */}
            <TouchableOpacity
              className={`p-3 rounded-lg mb-2 ${selectedRoleFilter === null ? 'bg-blue-500' : 'bg-gray-100'}`}
              onPress={() => {
                setSelectedRoleFilter(null);
                setShowFilterMenu(false);
              }}
            >
              <Text className={selectedRoleFilter === null ? 'text-white' : 'text-gray-700'}>Todos</Text>
            </TouchableOpacity>

            {/* Opciones de roles */}
            {roleOptions.map((rol) => (
              <TouchableOpacity
                key={rol}
                className={`p-3 rounded-lg mb-2 ${selectedRoleFilter === rol ? 'bg-blue-500' : 'bg-gray-100'}`}
                onPress={() => {
                  setSelectedRoleFilter(rol);
                  setShowFilterMenu(false);
                }}
              >
                <Text className={selectedRoleFilter === rol ? 'text-white' : 'text-gray-700'}>{rol}</Text>
              </TouchableOpacity>
            ))}

            {/* Botón Cerrar */}
            <TouchableOpacity
              className="bg-gray-200 p-3 rounded-lg mt-4"
              onPress={() => setShowFilterMenu(false)}
            >
              <Text className="text-center text-gray-700 font-medium">Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
