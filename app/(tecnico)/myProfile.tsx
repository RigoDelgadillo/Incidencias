import { useNavigation } from 'expo-router';
import { useEffect, useState } from "react";
import { Alert, Image, Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import InputForm from "@/components/InputForm";

import { supabase } from "@/utils/supabase";

import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

export default function MyProfile() {
    const [nombre, setNombre] = useState("");
    const [apellidos, setApellidos] = useState("");
    const [telefono, setTelefono] = useState("");
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);

    const getProfile = async () => {
        setLoading(true);
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error("Usuario no encontrado");

            const { data, error } = await supabase
                .from("usuarios")
                .select("nombre, apellido, telefono") 
                .eq("id_usuario", user.id)
                .single(); 

            if (error) throw error;

            if (data) {
                setNombre(data.nombre);
                setApellidos(data.apellido); 
                setTelefono(data.telefono);
            }
        } catch (err: any) {
            Alert.alert("Error", `No se pudieron cargar los datos: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getProfile();
    }, []); 

    const handleGoBack = () => {
        navigation.goBack(); 
    };

    const handleSaveProfile = async () => {
        if (!nombre || !apellidos || !telefono) {
            Alert.alert("Error", "Por favor, completa todos los campos.");
            return; 
        }
        
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario no autenticado");

            const updates = {
                nombre: nombre,
                apellido: apellidos,
                telefono: telefono,
            };

            const { error } = await supabase
                .from("usuarios")
                .update(updates) 
                .eq("id_usuario", user.id); 

            if (error) throw error;

            Alert.alert("Éxito", "Perfil actualizado correctamente.");
        } catch (error: any) {
            Alert.alert("Error", `No se pudo guardar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <View className="flex-1 mx-auto m-auto">
                <Text className="text-center text-4xl font-Inter-Bold mt-10">
                    Mi Perfil
                </Text>
                <Image
                    source={require("../../assets/images/photo_profile.png")}
                    className="w-40 h-40 rounded-full mx-auto " />

                <Text className="text-2xl text-center font-Inter-Bold text-gray-800">
                    {nombre} {apellidos}
                </Text>
                <Text className="text-lg text-center font-Inter-Regular text-gray-500 mt-1">
                    Teléfono: {telefono}
                </Text>

                <View className="w-full mx-auto mt-4 px-5 mb-2 bg-amber-200 p-2 rounded-full items-center flex-row gap-2">
                  <FontAwesome6 name="wrench" size={16} color="black" />
                  <Text className="text-lg font-Inter-Bold ">
                    Tecnico
                  </Text>
                </View>
                
                    

                <InputForm
                    placeholder="Escribe tu nombre"
                    label="Nombre"
                    value={nombre}
                    onChangeText={setNombre} />
                <InputForm
                    placeholder="Escribe tus apellidos"
                    label="Apellidos"
                    value={apellidos}
                    onChangeText={setApellidos} />
                <InputForm
                    placeholder="Escribe tu numero de telefono"
                    label="Telefono"
                    isNumber={true}
                    value={telefono}
                    onChangeText={setTelefono} />

                
                <CustomButton
                    label={loading ? "Guardando..." : "Guardar Cambios"}
                    onPress={handleSaveProfile}
                    disabled={loading}  
                />
                
            </View>
        </>
    );
        
}