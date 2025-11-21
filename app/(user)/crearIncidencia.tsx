import CustomButton from '@/components/CustomButton';
import { supabase } from "@/utils/supabase";
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PRIORIDAD_OPCIONES = [
    { id_prioridad: 1, nombre: 'Baja' },
    { id_prioridad: 2, nombre: 'Media' }, 
    { id_prioridad: 3, nombre: 'Alta' },
];


interface IncidenciaData {
    titulo: string;
    descripcion: string;
    id_equipo: number | null;
    id_prioridad: number | null;
    id_estado: number; 
}

export default function ReportarIncidenciaScreen() { 
    const router = useRouter();
    
    const [formData, setFormData] = useState<IncidenciaData>({
        titulo: '',
        descripcion: '',
        id_equipo: null,
        id_prioridad: null,
        id_estado: 1, 
    });

    interface Equipo {
    id_equipo: number;
    nombre: string;
}
    
    const [enviando, setEnviando] = useState(false);
    const [equiposList, setEquiposList] = useState<Equipo[]>([]);
    const [showEquipoModal, setShowEquipoModal] = useState(false);
    const [equipoSeleccionadoNombre, setEquipoSeleccionadoNombre] = useState<string>('');

    useEffect(() => {
        const fetchEquipos = async () => {
            try {
                const { data, error } = await supabase
                    .from('equipos')
                    .select('id_equipo, nombre')
                    .order('nombre', { ascending: true });
                
                if (error) throw error;
                if (data) setEquiposList(data);
            } catch (err) {
                console.error("Error cargando equipos:", err);
            }
        };
        fetchEquipos();
    }, []);

    const handleChange = (name: keyof IncidenciaData, value: string | number | null) => {
        let processedValue: any = value;
        
        if (name === 'id_prioridad' && typeof value === 'string') {
            processedValue = value ? Number(value) : null;
        }

        setFormData(prevData => ({
            ...prevData,
            [name]: processedValue,
        }));
    };

    const handlePrioridadSelect = (id: number) => {
        handleChange('id_prioridad', id);
    };

    const handleSelectEquipo = (equipo: Equipo) => {
        handleChange('id_equipo', equipo.id_equipo);
        setEquipoSeleccionadoNombre(equipo.nombre);
        setShowEquipoModal(false);
    };

    const handleSubmit = async () => {
        if (!formData.titulo || !formData.descripcion || !formData.id_equipo || !formData.id_prioridad) {
            Alert.alert("Campos requeridos", "Por favor, completa todos los campos, incluyendo la selección del equipo.");
            return;
        }
        
        setEnviando(true);

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) {
                Alert.alert("Error de sesión", "Debes iniciar sesión para reportar una incidencia.");
                router.replace('/(auth)/login'); 
                return;
            }

            const dataToSend = {
                titulo: formData.titulo,
                descripcion: formData.descripcion,
                id_prioridad: formData.id_prioridad,
                id_usuario: user.id,
                id_estado: 1,
                id_equipo: formData.id_equipo
            };

            const { error: insertError } = await supabase
                .from('incidencias')
                .insert(dataToSend);

            if (insertError) throw insertError;

            Alert.alert("Éxito", "¡Incidencia reportada correctamente!");
            router.back(); 

        } catch (err: any) {
            console.error('Error al enviar la incidencia:', err);
            Alert.alert("Error de envío", `se pudo registrar la incidencia: ${err.message}. Revise si la columna id_equipo o id_estado en la tabla incidencias permite NULL o si tiene problemas de RLS.`);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen 
                options={{
                    title: "Crear Incidencia", // Título de la cabecera
                    headerLeft: () => (
                        <Pressable 
                            onPress={() => router.back()} 
                            className='mx-4'
                        >
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </Pressable>
                    ),
                }} 
            />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                <Text
                    className='text-3xl font-Inter-Bold text-gray-900 mb-6 text-center'
                >Nueva Incidencia</Text>
                
                <View style={styles.inputGroup}>
                    <Text className='font-Inter-Bold text-gray-600 text-lg'>Título:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: La computadora no encendió"
                        value={formData.titulo}
                        onChangeText={(text) => handleChange('titulo', text)}
                        editable={!enviando}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text className='font-Inter-Bold text-gray-600 text-lg'>Descripción Detallada:</Text>
                    <TextInput
                        style={[styles.input, styles.textarea]}
                        placeholder="Detalles adicionales"
                        value={formData.descripcion}
                        onChangeText={(text) => handleChange('descripcion', text)}
                        multiline
                        numberOfLines={4}
                        editable={!enviando}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text className='font-Inter-Bold text-gray-600 text-lg'>Equipo:</Text>
                    <TouchableOpacity 
                        style={styles.selectorInput}
                        onPress={() => setShowEquipoModal(true)}
                        disabled={enviando}
                    >
                        <Text style={equipoSeleccionadoNombre ? styles.selectorText : styles.placeholderText}>
                            {equipoSeleccionadoNombre || "Seleccione un equipo de la lista"}
                        </Text>
                        <Text style={{color: '#9ca3af'}}>▼</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text className='font-Inter-Bold text-gray-600 text-lg'>Nivel de Prioridad:</Text>
                    <View style={styles.prioridadOptionsContainer}>
                        {PRIORIDAD_OPCIONES.map((prioridad) => (
                            <TouchableOpacity
                                key={prioridad.id_prioridad}
                                style={[
                                    styles.prioridadOption,
                                    formData.id_prioridad === prioridad.id_prioridad && styles.prioridadOptionSelected,
                                    { backgroundColor: getPrioridadColor(prioridad.id_prioridad) } 
                                ]}
                                onPress={() => handlePrioridadSelect(prioridad.id_prioridad)}
                                disabled={enviando}
                            >
                                <Text style={[
                                    styles.prioridadOptionText,
                                    formData.id_prioridad === prioridad.id_prioridad && styles.prioridadOptionTextSelected
                                ]}>
                                    {prioridad.nombre}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

            </ScrollView>
            
            <View style={styles.buttonContainer}>
                <CustomButton
                    label={enviando ? 'Enviando...' : 'Enviar Reporte'}
                    onPress={handleSubmit}
                    disabled={enviando}
                />
            </View>

            <Modal
                visible={showEquipoModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEquipoModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Seleccionar Equipo</Text>
                        
                        {equiposList.length === 0 ? (
                            <Text style={{textAlign: 'center', padding: 20, color: '#6b7280'}}>
                                Cargando equipos o no hay datos...
                            </Text>
                        ) : (
                            <FlatList
                                data={equiposList}
                                keyExtractor={(item) => item.id_equipo.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={styles.modalItem}
                                        onPress={() => handleSelectEquipo(item)}
                                    >
                                        <Text
                                            className='font-Inter-Regular text-lg'
                                        >{item.nombre}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        )}

                        <CustomButton
                            label="Cancelar"
                            color="bg-white"
                            borderColor="b-slate-800 border"
                            textColor='black'
                            onPress={() => setShowEquipoModal(false)}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const getPrioridadColor = (id: number) => {
    switch (id) {
        case 1:
            return '#dcfce7'; 
        case 2:
            return '#fef9c3'; 
        case 3:
            return '#fee2e2'; 
        default:
            return '#f3f4f6'; 
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100, 
    },
    inputGroup: {
        marginBottom: 20,
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textarea: {
        height: 100,
        textAlignVertical: 'top', 
    },
    prioridadOptionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    prioridadOption: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        alignItems: 'center',
    },
    prioridadOptionSelected: {
        borderColor: '#2563eb', 
        borderWidth: 2,
    },
    prioridadOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    prioridadOptionTextSelected: {
        fontWeight: 'bold',
        color: '#1f2937',
    },
    noteText: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 10,
        textAlign: 'center',
    },
    buttonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      backgroundColor: '#f9fafb',
      borderTopWidth: 1,
      borderTopColor: '#e5e7eb',
    },
    selectorInput: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    selectorText: {
        fontSize: 16,
        color: '#1f2937',
    },
    placeholderText: {
        fontSize: 16,
        color: '#9ca3af',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        maxHeight: '60%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#1f2937',
    },
    modalItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalCloseButton: {
        marginTop: 15,
        padding: 10,
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
    },
    modalCloseText: {
        color: '#4b5563',
        fontWeight: '600',
    }
});