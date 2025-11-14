import CustomButton from '@/components/CustomButton';
import { supabase } from "@/utils/supabase";
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// --- OPCIONES FIJAS DE PRIORIDAD ---
// Estos IDs deben coincidir con tu tabla 'prioridades' en Supabase (1=Baja, 2=Medios/Media, 3=Alta).
const PRIORIDAD_OPCIONES = [
    { id_prioridad: 1, nombre: 'Baja' },
    { id_prioridad: 2, nombre: 'Media' }, // Ajustado para ser más corto que 'Medios de comunicación' de la BD
    { id_prioridad: 3, nombre: 'Alta' },
];

// --- Interfaces de Datos ---

interface IncidenciaData {
    titulo: string;
    descripcion: string;
    // Se mantiene null ya que no usamos el ID de un Picker
    id_equipo: null; 
    // Campo para el texto libre del equipo (la BD AÚN no lo tiene)
    nombre_equipo_manual: string; 
    id_prioridad: number | null;
}

// --- Componente de la Pantalla ---
export default function ReportarIncidenciaScreen() { 
    const router = useRouter();
    
    // 1. Estados para los datos del formulario
    const [formData, setFormData] = useState<IncidenciaData>({
        titulo: '',
        descripcion: '',
        id_equipo: null, 
        nombre_equipo_manual: '', // Campo de texto libre para Equipo
        id_prioridad: null,
    });
    
    // 2. Estados de control
    const [enviando, setEnviando] = useState(false);

    // Manejador de Cambios
    const handleChange = (name: keyof IncidenciaData, value: string | number | null) => {
        let processedValue: any = value;
        
        // Convertir IDs a número solo si el campo es de tipo ID
        if (name === 'id_prioridad' && typeof value === 'string') {
            processedValue = value ? Number(value) : null;
        }

        setFormData(prevData => ({
            ...prevData,
            [name]: processedValue,
        }));
    };

    // Manejador de selección de prioridad (usado por los botones)
    const handlePrioridadSelect = (id: number) => {
        handleChange('id_prioridad', id);
    };

    // Manejador de Envío (Supabase)
    const handleSubmit = async () => {
        // Validación de campos
        if (!formData.titulo || !formData.descripcion || !formData.nombre_equipo_manual || !formData.id_prioridad) {
            Alert.alert("Campos requeridos", "Por favor, completa todos los campos del reporte (Título, Descripción, Equipo y Prioridad).");
            return;
        }
        
        setEnviando(true);

        try {
            // Obtener el ID del usuario
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) {
                Alert.alert("Error de sesión", "Debes iniciar sesión para reportar una incidencia.");
                router.replace('/(auth)/login'); 
                return;
            }

            // CORRECCIÓN CLAVE: 
            // Se elimina 'nombre_equipo_manual' de dataToSend para evitar el error PGRST204 
            // (Columna inexistente en la BD).
            const dataToSend = {
                titulo: formData.titulo,
                descripcion: formData.descripcion,
                id_prioridad: formData.id_prioridad,
                id_usuario: user.id,
                // 'id_equipo' se omite; se espera que acepte NULL en la BD.
            };

            // Insertar la incidencia
            const { error: insertError } = await supabase
                .from('incidencias')
                .insert(dataToSend);

            if (insertError) throw insertError;

            Alert.alert("Éxito", "¡Incidencia reportada correctamente!");
            router.back(); 

        } catch (err: any) {
            console.error('Error al enviar la incidencia:', err);
            Alert.alert("Error de envío", `No se pudo registrar la incidencia: ${err.message}. Revise si la columna id_equipo en la tabla incidencias permite NULL o si tiene problemas de RLS.`);
        } finally {
            setEnviando(false);
        }
    };


    // --- Renderizado del Formulario (React Native) ---
    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                <Text style={styles.header}>Reportar Nueva Incidencia</Text>
                
                {/* Campo: Título */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Título:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: La computadora no encendió"
                        value={formData.titulo}
                        onChangeText={(text) => handleChange('titulo', text)}
                        editable={!enviando}
                    />
                </View>

                {/* Campo: Descripción Detallada */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Descripción Detallada:</Text>
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

                {/* Campo: Equipo (Texto Libre) */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Equipo:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Escriba el nombre o identificador del equipo"
                        value={formData.nombre_equipo_manual}
                        onChangeText={(text) => handleChange('nombre_equipo_manual', text)}
                        editable={!enviando}
                    />
                </View>

                {/* Campo: Prioridad (Botones Seleccionables) */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nivel de Prioridad:</Text>
                    <View style={styles.prioridadOptionsContainer}>
                        {PRIORIDAD_OPCIONES.map((prioridad) => (
                            <TouchableOpacity
                                key={prioridad.id_prioridad}
                                style={[
                                    styles.prioridadOption,
                                    // Aplica estilo de seleccionado si el ID coincide
                                    formData.id_prioridad === prioridad.id_prioridad && styles.prioridadOptionSelected,
                                    // Color de fondo dinámico para mejor visualización
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

                <Text style={styles.noteText}>
                    *La fecha de creación y el estado inicial se registrarán automáticamente.
                </Text>
            </ScrollView>
            
            {/* Botón de envío */}
            <View style={styles.buttonContainer}>
                <CustomButton
                    label={enviando ? 'Enviando...' : 'Enviar Reporte'}
                    onPress={handleSubmit}
                    disabled={enviando}
                />
            </View>
        </View>
    );
}

// Función auxiliar para asignar colores a las prioridades
const getPrioridadColor = (id: number) => {
    switch (id) {
        case 1:
            return '#dcfce7'; // Verde para Baja
        case 2:
            return '#fef9c3'; // Amarillo para Media
        case 3:
            return '#fee2e2'; // Rojo para Alta
        default:
            return '#f3f4f6'; // Gris por defecto
    }
}

// --- Estilos ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100, 
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 25,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
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
    // Estilos para los botones de Prioridad
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
        borderColor: '#2563eb', // Borde azul para el seleccionado
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
    // Estilos generales
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
});