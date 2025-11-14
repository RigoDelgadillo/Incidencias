import { supabase } from "@/utils/supabase";
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

// La función generateUUID se ELIMINA ya que la BD debe gestionar el ID,
// especialmente si el error de Foreign Key indica que el ID debe venir de auth.users.

interface UsuarioFormData {
    nombre: string;
    apellido: string;
    correo: string; // Se mantiene el correo como dato de perfil
    telefono: string;
    rol_id: number;
}

export default function UsuarioForm() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<UsuarioFormData>({
        nombre: '',
        apellido: '',
        correo: '',
        telefono: '',
        rol_id: 2, // Default: Usuario
    });

    // Mapa de roles con sus IDs
    const roleMap = [
        { id: 1, nombre: 'Administrador' },
        { id: 2, nombre: 'Usuario' },
        { id: 3, nombre: 'Técnico' },
    ];

    // Cargar usuario si estamos editando
    useEffect(() => {
        if (id) {
            loadUser(String(id));
        }
    }, [id]);

    const loadUser = async (userId: string) => {
        setLoading(true);
        try {
            const possibleIdColumns = ['id', 'id_usuario', 'id_user', 'uid', 'user_id'];
            const possibleEmailColumns = ['correo', 'email', 'mail'];
            let data = null;
            let error = null;

            for (const idCol of possibleIdColumns) {
                const { data: result, error: err } = await supabase
                    .from('usuarios')
                    .select('*')
                    .eq(idCol, userId)
                    .single();

                if (!err) {
                    data = result;
                    error = null;
                    console.log(`Usuario cargado usando columna: ${idCol}`);
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

                setFormData({
                    nombre: data.nombre || '',
                    apellido: data.apellido || '',
                    correo: userEmail,
                    telefono: data.telefono || '',
                    rol_id: parseInt(data.rol_id || data.id_rol || '2', 10),
                });
                console.log('Usuario cargado correctamente:', data);
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
        if (!formData.nombre.trim()) {
            Alert.alert('Validación', 'El nombre es requerido');
            return;
        }
        if (!formData.apellido.trim()) {
            Alert.alert('Validación', 'El apellido es requerido');
            return;
        }
        if (!formData.correo.trim()) {
            Alert.alert('Validación', 'El correo es requerido');
            return;
        }

        setLoading(true);
        try {
            // --- Detección de Nombres de Columnas ---
            const possibleRolColumns = ['rol_id', 'id_rol', 'role_id', 'role'];
            const possibleIdColumns = ['id', 'id_usuario', 'id_user', 'uid', 'user_id'];
            const possibleEmailColumns = ['correo', 'email', 'mail'];

            let rolColumnName = 'rol_id';
            let emailColumnName = 'correo';
            // idColumnName ya se usa en loadUser y update, no es necesario para la inserción si BD genera ID

            const { data: sampleData } = await supabase
                .from('usuarios')
                .select('*')
                .limit(1);

            if (sampleData && sampleData.length > 0) {
                const foundRol = possibleRolColumns.find((col) => Object.prototype.hasOwnProperty.call(sampleData[0], col));
                if (foundRol) rolColumnName = foundRol;
                
                const foundEmail = possibleEmailColumns.find((col) => Object.prototype.hasOwnProperty.call(sampleData[0], col));
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
                    const { error: err } = await supabase
                        .from('usuarios')
                        .update(dataToSave)
                        .eq(idCol, String(id));

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
                
                // NOTA IMPORTANTE: Si la columna ID en 'usuarios' tiene una CLAVE FORÁNEA a 'auth.users(id)',
                // este intento de inserción fallará con el mismo error.
                // La solución en la BD es ELIMINAR esa clave foránea si quieres crear perfiles
                // que no estén vinculados a un usuario de autenticación de Supabase.
                
                const { error, data: insertedData } = await supabase
                    .from('usuarios')
                    .insert(dataToSave)
                    .select(); // Se agrega .select() para obtener el registro insertado

                if (error) {
                    console.error('Error al crear perfil (DB):', error);
                    // El error original "violates foreign key constraint" es MUY PROBABLE que ocurra aquí.
                    // Si ocurre, se debe a la configuración de la BD.
                    throw new Error(`Error al crear perfil: ${error.message}. **Revisa la configuración de clave foránea en la tabla 'usuarios'.**`);
                }

                Alert.alert('Éxito', 'Usuario creado correctamente.');
            }

            router.back();
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
                    <TouchableOpacity onPress={() => router.back()}>
                        <Feather name="x" size={24} color="#4B5563" />
                    </TouchableOpacity>
                </View>

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
                        onPress={() => router.back()}
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