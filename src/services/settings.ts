import { supabase } from '../lib/supabase';

// Configuración institucional por defecto (fallback si no hay datos en BD)
export const DEFAULT_SETTINGS = {
  school_name: 'I.E. Jesús de Nazaret',
  slogan: 'Educación secundaria de calidad para el desarrollo de Bellavista',
  history: `La Institución Educativa Jesús de Nazaret se encuentra ubicada en el centro poblado de Bellavista, en el distrito y provincia de Celendín, región Cajamarca. Desde su creación, ha sido un referente educativo para las familias de la zona, brindando educación secundaria pública y gratuita a jóvenes de 12 a 17 años bajo la modalidad de Educación Básica Regular.\n\nA lo largo de los años, la institución ha consolidado su compromiso con la formación integral de sus estudiantes, combinando el desarrollo académico con la práctica de valores y el fortalecimiento de habilidades para la vida. Con grupos reducidos de aproximadamente 20 estudiantes por aula, se garantiza una atención más personalizada y un ambiente propicio para el aprendizaje.\n\nHoy, la I.E. Jesús de Nazaret continúa siendo un espacio de oportunidades para los jóvenes de Bellavista y sus alrededores, con docentes comprometidos y una comunidad educativa unida en torno al progreso de sus estudiantes.`,
  mission: `Brindar una educación secundaria integral, inclusiva y de calidad a los jóvenes de Bellavista y la provincia de Celendín, promoviendo el desarrollo del pensamiento crítico, la práctica de valores y la formación de ciudadanos responsables, capaces de continuar estudios superiores o integrarse de manera productiva a la sociedad.`,
  vision: `Ser reconocida como una institución educativa de referencia en la provincia de Celendín, destacada por la calidad de su enseñanza, el compromiso de su comunidad educativa y la formación de jóvenes íntegros, críticos y preparados para los desafíos del mundo actual.`,
  values_text: `Respeto • Responsabilidad • Honestidad • Disciplina • Solidaridad • Compromiso • Identidad`,
  address: 'Bellavista, Celendín, Cajamarca, Perú',
  phone: '',
  email: '',
  whatsapp: '51999999999',
  facebook: 'https://www.facebook.com/p/Institución-Educativa-Jesús-de-Nazaret-_-Bellavista-100085320282328/',
  instagram: '',
  youtube: '',
  logo_url: 'https://scontent.flim9-1.fna.fbcdn.net/v/t39.30808-6/287194106_104240939096582_2519527103714913921_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEicJlqnEuRlyjoKt7whkja2IWO8TXpas_YhY7xNelqzyt4H3yqMTyv6mcVPKAc0XTP3KFIT-eTXRuP40MbXt2A&_nc_ohc=5kb-T5seVVgQ7kNvwG0pTxg&_nc_oc=AdoFDBVseZb475n-M8FPFJ0jAipklTspZgDHvI3nqWJcTQjH9sEVU31pQtguJgOCoDM&_nc_zt=23&_nc_ht=scontent.flim9-1.fna&_nc_gid=p6zA30yaN7fLUV022BbZBA&_nc_ss=7a3a8&oh=00_Af1wKdKnchNa06zQN_9Uzk74JSxqhzZXNd_VfL_a8SFqBA&oe=69D4AEDD',
  hero_image_url: 'https://scontent.flim9-1.fna.fbcdn.net/v/t39.30808-6/652324996_892890870231581_6416258328698868133_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeECcOT7_fOXc-6abkNEhLzYGejVJT0KKIQZ6NUlPQoohHcbM4oglBuOdjM6Jh8L0xYevS1BXbq9TApryJ5aFeMV&_nc_ohc=U4Xjy3NRn5kQ7kNvwFTN-LC&_nc_oc=AdpMqRuWN5ENeWSkT-KxxJTxKb2eunHO4yGNWPcIiwJX6NN3mVU_lR43fVBi474vDz0&_nc_zt=23&_nc_ht=scontent.flim9-1.fna&_nc_gid=hhYWBTTQSPqPUzZYU25DuQ&_nc_ss=7a3a8&oh=00_Af12Cv6uDbH0ySTdKXFQ_aybgc8MsYn64jxQxh4qaZQaEQ&oe=69D4ACC0',
};

export type Settings = typeof DEFAULT_SETTINGS & { id?: number; updated_at?: string };

// Obtiene la configuración institucional
export async function getSettings(): Promise<Settings> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single();

    if (error || !data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...data };
  } catch {
    // Fallback a datos demo si Supabase no está configurado
    return DEFAULT_SETTINGS;
  }
}

// Actualiza la configuración institucional
export async function updateSettings(updates: Partial<Settings>) {
  const { data: existing } = await supabase.from('settings').select('id').single();

  if (existing) {
    return supabase.from('settings').update(updates).eq('id', existing.id);
  } else {
    return supabase.from('settings').insert({ ...DEFAULT_SETTINGS, ...updates });
  }
}
