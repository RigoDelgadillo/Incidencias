import { supabase } from "@/utils/supabase";
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

// =================================================================
// ESTRUCTURAS DE DATOS
// =================================================================

interface User {
    id: string;
    name: string;
    lastName: string;
    phone: string;
    role: string;
    roleDescription?: string;
}

interface UsuarioFormData {
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    rol_id: number;
}

// Mapa de roles con sus IDs (Usado tanto en la lista como en el formulario)
const roleMap = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Usuario' },
    { id: 3, nombre: 'Técnico' },
];

// Mapeo inverso de roles (Nombre a ID) para consistencia
const roleIdMap = new Map([
    ['Administrador', 1],
    ['Usuario', 2],
    ['Técnico', 3],
]);

// =================================================================
// COMPONENTE: FORMULARIO DE USUARIO (USADO COMO MODAL INTERNO)
// =================================================================

interface UsuarioFormProps {
    id: string | null; // ID del usuario a editar, o null para crear
    onClose: () => void;
    onSaveSuccess: () => void;
}

function UsuarioFormContent({ id, onClose, onSaveSuccess }: UsuarioFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<UsuarioFormData>({
        nombre: '',
        apellido: '',
        correo: '',
        telefono: '',
        rol_id: 2, // Default: Usuario
    });

    // Cargar usuario si estamos editando
    useEffect(() => {
        if (id) {
            loadUser(String(id));
        } else {
            // Resetear el formulario si es nuevo
            setFormData({
                nombre: '',
                apellido: '',
                correo: '',
                telefono: '',
                rol_id: 2,
            });
        }
    }, [id]);

    const loadUser = async (userId: string) => {
        setLoading(true);
        try {
            const possibleIdColumns = ['id', 'id_usuario', 'id_user', 'uid', 'user_id'];
            const possibleEmailColumns = ['correo', 'email', 'mail'];
            let data: any = null;
            let error: any = null;

            for (const idCol of possibleIdColumns) {
                const { data: result, error: err } = await supabase
                    .from('usuarios')
                    .select('*')
                    .eq(idCol, userId)
                    .single();

                if (!err) {
                    data = result;
                    error = null;
                    // console.log(`Usuario cargado usando columna: ${idCol}`);
                    break;
                }
                error = err;
            }

            if (error) throw error;

            if (data) {
                let userEmail = '';
                for (const emailCol of possibleEmailColumns) {
                    if (data[emailCol]) {
                        userEmail = data[emailCol];
                        break;
                    }
                }

                const rolValue = data.rol_id || data.id_rol || data.role_id || data.role || '2';
                // Asegurar que sea un número, usando el mapeo inverso si es un string de rol
                let rolId = parseInt(rolValue, 10);
                if (isNaN(rolId)) {
                    rolId = roleIdMap.get(String(rolValue)) || 2;
                }
                
                setFormData({
                    nombre: data.nombre || '',
                    apellido: data.apellido || '',
                    correo: userEmail,
                    telefono: data.telefono || '',
                    rol_id: rolId,
                });
                // console.log('Usuario cargado correctamente:', data);
            }
        } catch (error) {
            console.error('Error loading user:', error);
            Alert.alert('Error', 'No se pudo cargar el usuario');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Validar campos requeridos
        if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.correo.trim()) {
            Alert.alert('Validación', 'Nombre, Apellido y Correo son requeridos.');
            return;
        }

        setLoading(true);
        try {
            // --- Detección de Nombres de Columnas (Simplificada) ---
            let rolColumnName = 'rol_id';
            let emailColumnName = 'correo';
            const possibleRolColumns = ['rol_id', 'id_rol', 'role_id', 'role'];
            const possibleEmailColumns = ['correo', 'email', 'mail'];
            const possibleIdColumns = ['id', 'id_usuario', 'id_user', 'uid', 'user_id'];
            
            // Intenta detectar nombres de columna
            const { data: sampleData } = await supabase
                .from('usuarios')
                .select('*')
                .limit(1);

            if (sampleData && sampleData.length > 0) {
                const first = sampleData[0];
                const foundRol = possibleRolColumns.find((col) => Object.prototype.hasOwnProperty.call(first, col));
                if (foundRol) rolColumnName = foundRol;
                
                const foundEmail = possibleEmailColumns.find((col) => Object.prototype.hasOwnProperty.call(first, col));
                if (foundEmail) emailColumnName = foundEmail;
            }

            // Datos que se guardarán
            const dataToSave: any = {
                nombre: formData.nombre.trim(),
                apellido: formData.apellido.trim(),
                telefono: formData.telefono.trim(),
            };
            dataToSave[emailColumnName] = formData.correo.trim();
            dataToSave[rolColumnName] = formData.rol_id;


            if (id) {
                // --- 1. ACTUALIZAR USUARIO EXISTENTE ---
                let updated = false;
                let error: any = null;

                for (const idCol of possibleIdColumns) {
                    const { error: err, count } = await supabase
                        .from('usuarios')
                        .update(dataToSave)
                        .eq(idCol, String(id))
                        .select(); // Agregado .select() para obtener el error de forma más fiable

                    if (!err) {
                        updated = true;
                        break;
                    }
                    error = err;
                }

                if (!updated) throw new Error(`Error al actualizar perfil: ${error?.message || 'Columna ID no encontrada para actualización.'}`);
                Alert.alert('Éxito', 'Usuario actualizado correctamente');

            } else {
                // --- 2. CREAR NUEVO USUARIO (Dejando que la BD asigne el ID) ---
                
                // Advertencia importante sobre la clave foránea a 'auth.users(id)'
                const { error } = await supabase
                    .from('usuarios')
                    .insert(dataToSave);

                if (error) {
                    console.error('Error al crear perfil (DB):', error);
                    throw new Error(`Error al crear perfil: ${error.message}. **Revisa la configuración de clave foránea en la tabla 'usuarios'.**`);
                }

                Alert.alert('Éxito', 'Usuario creado correctamente.');
            }

            onSaveSuccess(); // Llama a la función para refrescar la lista
            onClose(); // Cierra el modal/formulario
        } catch (error) {
            console.error('Error saving user:', error);
            Alert.alert('Error', (error as Error).message || 'No se pudo guardar el usuario.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView className="flex-1 p-4">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-2xl font-bold">{id ? 'Editar Usuario' : 'Nuevo Usuario'}</Text>
                    <TouchableOpacity onPress={onClose} disabled={loading}>
                        <Feather name="x" size={24} color="#4B5563" />
                    </TouchableOpacity>
                </View>

                {loading && !id && <ActivityIndicator size="large" color="#3B82F6" className="my-4" />}

                {/* Nombre */}
                <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">Nombre *</Text>
                    <TextInput
                        className="border border-gray-300 rounded-lg p-3"
                        placeholder="Ej: Juan"
                        value={formData.nombre}
                        onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                        editable={!loading}
                    />
                </View>

                {/* Apellido */}
                <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">Apellido *</Text>
                    <TextInput
                        className="border border-gray-300 rounded-lg p-3"
                        placeholder="Ej: Pérez"
                        value={formData.apellido}
                        onChangeText={(text) => setFormData({ ...formData, apellido: text })}
                        editable={!loading}
                    />
                </View>

                {/* Correo Electrónico */}
                <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">Correo Electrónico *</Text>
                    <TextInput
                        className="border border-gray-300 rounded-lg p-3"
                        placeholder="Ej: usuario@dominio.com"
                        value={formData.correo}
                        onChangeText={(text) => setFormData({ ...formData, correo: text })}
                        editable={!loading}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                {/* Teléfono */}
                <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">Teléfono</Text>
                    <TextInput
                        className="border border-gray-300 rounded-lg p-3"
                        placeholder="Ej: +56 9 1234 5678"
                        value={formData.telefono}
                        onChangeText={(text) => setFormData({ ...formData, telefono: text })}
                        editable={!loading}
                        keyboardType="phone-pad"
                    />
                </View>

                {/* Rol */}
                <View className="mb-6">
                    <Text className="text-gray-700 font-medium mb-2">Rol *</Text>
                    <View className="border border-gray-300 rounded-lg overflow-hidden">
                        {roleMap.map((role) => (
                            <TouchableOpacity
                                key={role.id}
                                className={`p-3 border-b border-gray-200 flex-row items-center justify-between ${
                                    formData.rol_id === role.id ? 'bg-blue-50' : 'bg-white'
                                }`}
                                onPress={() => setFormData({ ...formData, rol_id: role.id })}
                                disabled={loading}
                            >
                                <Text className={formData.rol_id === role.id ? 'text-blue-600 font-medium' : 'text-gray-700'}>
                                    {role.nombre}
                                </Text>
                                {formData.rol_id === role.id && (
                                    <Feather name="check" size={20} color="#3B82F6" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Botones */}
                <View className="flex-row gap-3 mt-8">
                    <TouchableOpacity
                        className="flex-1 bg-gray-200 py-3 rounded-lg"
                        onPress={onClose}
                        disabled={loading}
                    >
                        <Text className="text-center text-gray-700 font-medium">Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 py-3 rounded-lg ${loading ? 'bg-gray-400' : 'bg-blue-500'}`}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text className="text-center text-white font-medium">
                            {loading ? 'Guardando...' : 'Guardar'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// =================================================================
// COMPONENTE PRINCIPAL: GESTIÓN DE USUARIOS
// =================================================================

export default function UserManagementScreen() {
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [lastFetchInfo, setLastFetchInfo] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [idColumn, setIdColumn] = useState<string>('id');
    
    // Estados para el formulario (Nuevo/Editar)
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [userToEditId, setUserToEditId] = useState<string | null>(null);

    // Opciones de roles para filtro
    const roleOptions = roleMap.map(r => r.nombre);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data: usuariosData, error: usuariosError } = await supabase
                .from('usuarios')
                .select('*')
                .limit(100);

            if (usuariosError) throw usuariosError;

            // Detección dinámica de columna ID
            let detectedIdColumn = 'id';
            if (usuariosData && usuariosData.length > 0) {
                const first = usuariosData[0];
                const possibleId = ['id', 'id_usuario', 'id_user', 'uid', 'user_id'];
                const found = possibleId.find((k) => Object.prototype.hasOwnProperty.call(first, k));
                detectedIdColumn = found || (Object.keys(first).find((k) => k.toLowerCase().includes('id')) || 'id');
                setIdColumn(detectedIdColumn);
                // console.log('ID column detected:', detectedIdColumn);
            }

            setLastFetchInfo(JSON.stringify({ 
                usuarios: { 
                    source: 'usuarios', 
                    data: usuariosData, 
                    error: usuariosError,
                    timestamp: new Date().toISOString()
                },
            }, null, 2));

            // Crear mapa de roles con valores fijos según la estructura de la BD
            const rolesMap = new Map(roleMap.map(r => [r.id, { nombre: r.nombre }]));

            if (usuariosData && Array.isArray(usuariosData)) {
                const mapped = usuariosData.map((usuario, index) => {
                    // Obtener el ID de forma segura
                    const userId = String(usuario[detectedIdColumn] || usuario.id || usuario.user_id || `temp-${index}`);
                    
                    // Convertir el rol_id a número o buscar por nombre si es string
                    const rolValue = usuario.rol_id || usuario.role_id || usuario.id_rol || usuario.role || '2';
                    let rolId = parseInt(rolValue, 10);
                    if (isNaN(rolId)) {
                        rolId = roleIdMap.get(String(rolValue)) || 2;
                    }

                    const rol = rolesMap.get(rolId);
                    
                    return {
                        id: userId, 
                        name: usuario.nombre || usuario.first_name || usuario.name || '',
                        lastName: usuario.apellido || usuario.last_name || usuario.apellidos || '',
                        phone: usuario.telefono || usuario.phone || usuario.tel || '',
                        role: rol?.nombre || 'Sin rol asignado'
                    };
                });
                setUsers(mapped);
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            Alert.alert('Error', 'No se pudieron obtener los usuarios. Revisa la conexión o permisos (RLS/policies).');
        } finally {
            setLoading(false);
        }
    };

    // Refetch when the screen is focused
    useFocusEffect(
        useCallback(() => {
            if (!isFormVisible) { // Solo refrescar si el formulario no está abierto
                fetchUsers();
            }
        }, [isFormVisible])
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
            Alert.alert('Éxito', 'Usuario eliminado correctamente.');
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
    
    // Funciones para abrir/cerrar el formulario
    const handleOpenForm = (id: string | null) => {
        setUserToEditId(id);
        setIsFormVisible(true);
        setIsDetailModalVisible(false); // Cierra el modal de detalle si estaba abierto
    };

    const handleCloseForm = () => {
        setIsFormVisible(false);
        setUserToEditId(null);
    };

    const handleSaveSuccess = () => {
        // Al guardar, refrescamos la lista
        fetchUsers();
    };


    // Filtrar usuarios por búsqueda y por rol seleccionado
    const filteredUsers = users.filter(user => {
        const fullName = `${user.name} ${user.lastName}`.toLowerCase();
        const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                              user.phone.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = selectedRoleFilter ? user.role === selectedRoleFilter : true;
        return matchesSearch && matchesRole;
    });

    // Obtener etiqueta para el botón de filtro
    const getFilterLabel = () => {
        return selectedRoleFilter ? selectedRoleFilter : 'Todos';
    };

    // Si el formulario está visible, lo mostramos
    if (isFormVisible) {
        return (
            <UsuarioFormContent 
                id={userToEditId} 
                onClose={handleCloseForm} 
                onSaveSuccess={handleSaveSuccess} 
            />
        );
    }

    // Si el formulario no está visible, mostramos la lista principal
    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 p-4">
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
                    {/* Botón para crear nuevo usuario */}
                    <TouchableOpacity 
                        className="bg-blue-500 rounded-full w-10 h-10 items-center justify-center"
                        onPress={() => handleOpenForm(null)}
                    >
                        <Feather name="plus" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="flex-row items-center border border-gray-300 rounded-lg p-2 mb-4">
                    <Feather name="search" size={20} color="gray" />
                    <TextInput
                        className="flex-1 ml-2"
                        placeholder="Buscar por nombre o teléfono..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Filter Button */}
                <View className="mb-4">
                    <TouchableOpacity 
                        className="bg-blue-100 px-4 py-2 rounded-lg flex-row items-center self-start"
                        onPress={() => setShowFilterMenu(true)}
                    >
                        <Feather name="filter" size={16} color="#3B82F6" className="mr-2" />
                        <Text className="text-blue-500 font-medium">Filtrar Rol: {getFilterLabel()}</Text>
                    </TouchableOpacity>
                </View>

                {/* Users List */}
                <Text className="text-xl font-semibold mb-4">Usuarios ({filteredUsers.length})</Text>
                <ScrollView 
                    className="flex-1" 
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {loading && !refreshing ? (
                        <ActivityIndicator size="large" color="#3B82F6" className="my-10" />
                    ) : filteredUsers.length === 0 ? (
                        <Text className="text-gray-500 mt-4 text-center">No hay usuarios que coincidan con la búsqueda o filtro.</Text>
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
                                        setIsDetailModalVisible(true);
                                    }}
                                >
                                    <Text className="text-lg font-medium">{`${user.name} ${user.lastName}`.trim()}</Text>
                                    <Text className="text-gray-500 text-sm">{user.role}</Text>
                                </TouchableOpacity>
                                <View className="flex-row gap-4">
                                    <TouchableOpacity onPress={() => handleOpenForm(user.id)}>
                                        <Feather name="edit-2" size={20} color="#4B5563" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => confirmDelete(user.id, user.name)}>
                                        <Feather name="trash-2" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>

                {/* Modal de Detalle de Usuario */}
                <Modal
                    visible={isDetailModalVisible && !!selectedUser}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setIsDetailModalVisible(false)}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} className="items-center justify-center">
                        <View style={{ width: '90%', maxWidth: 360 }} className="bg-white rounded-xl p-6">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-xl font-bold">Detalle del Usuario</Text>
                                <TouchableOpacity onPress={() => setIsDetailModalVisible(false)} className="p-2">
                                    <Feather name="x" size={24} color="#4B5563" />
                                </TouchableOpacity>
                            </View>

                            {selectedUser && (
                                <View className="space-y-4">
                                    <View>
                                        <Text className="text-gray-500 text-sm">Nombre Completo</Text>
                                        <Text className="text-gray-800 font-medium">{`${selectedUser.name} ${selectedUser.lastName}`}</Text>
                                    </View>
                                    <View>
                                        <Text className="text-gray-500 text-sm">Teléfono</Text>
                                        <Text className="text-gray-800 font-medium">{selectedUser.phone || 'No especificado'}</Text>
                                    </View>
                                    <View>
                                        <Text className="text-gray-500 text-sm">Rol</Text>
                                        <Text className="text-gray-800 font-medium">{selectedUser.role}</Text>
                                    </View>
                                    <View className="flex-row justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                                        <TouchableOpacity 
                                            className="px-4 py-2 rounded-lg bg-gray-100"
                                            onPress={() => setIsDetailModalVisible(false)}
                                        >
                                            <Text className="text-gray-600">Cerrar</Text>
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity 
                                            className="px-4 py-2 rounded-lg bg-blue-500"
                                            onPress={() => handleOpenForm(selectedUser.id)}
                                        >
                                            <Text className="text-white">Editar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </Modal>

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
        </SafeAreaView>
    );
}