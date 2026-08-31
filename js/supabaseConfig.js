/* ==========================================================================
   FINANPRO - CONFIGURACIÓN Y CLIENTE DE SUPABASE
   Reemplaza los valores de SUPABASE_URL y SUPABASE_ANON_KEY con los de tu
   proyecto en https://supabase.com (Project Settings -> API).
   ========================================================================== */

const SUPABASE_URL = 'https://crbtfrvkmabkofktegbp.supabase.co/rest/v1/'; 
const SUPABASE_ANON_KEY = 'sb_publishable_HrMCQ4pGmvpUh-3xsBgfFw_qHBQ6kDk';

let supabaseClient = null;

// Inicializa el cliente si las credenciales fueron configuradas y la librería está cargada
if (window.supabase && SUPABASE_URL !== 'https://crbtfrvkmabkofktegbp.supabase.co/rest/v1/' && SUPABASE_ANON_KEY !== 'sb_publishable_HrMCQ4pGmvpUh-3xsBgfFw_qHBQ6kDk') {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase conectado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar Supabase:', error);
  }
} else {
  console.warn('⚠️ Supabase no está configurado aún. Usando modo de almacenamiento local (localStorage).');
}

const SupabaseDB = {
  isConfigured() {
    return supabaseClient !== null;
  },

  /* --- TRANSACCIONES --- */
  async getTransactions() {
    if (!this.isConfigured()) return null;
    const { data, error } = await supabaseClient
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error al obtener transacciones:', error);
      return null;
    }
    return data;
  },

  async addTransaction(transaction) {
    if (!this.isConfigured()) return null;
    const payload = {
      description: transaction.description,
      amount: parseFloat(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      date: transaction.date
    };
    const { data, error } = await supabaseClient
      .from('transactions')
      .insert([payload])
      .select();

    if (error) {
      console.error('Error al insertar transacción:', error);
      return null;
    }
    return data ? data[0] : null;
  },

  async deleteTransaction(id) {
    if (!this.isConfigured()) return false;
    const { error } = await supabaseClient
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar transacción:', error);
      return false;
    }
    return true;
  },

  /* --- METAS DE AHORRO --- */
  async getGoals() {
    if (!this.isConfigured()) return null;
    const { data, error } = await supabaseClient
      .from('goals')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error al obtener metas:', error);
      return null;
    }
    return data;
  },

  async addGoal(goal) {
    if (!this.isConfigured()) return null;
    const payload = {
      name: goal.name,
      target: parseFloat(goal.target),
      current: parseFloat(goal.current || 0),
      deadline: goal.deadline
    };
    const { data, error } = await supabaseClient
      .from('goals')
      .insert([payload])
      .select();

    if (error) {
      console.error('Error al añadir meta:', error);
      return null;
    }
    return data ? data[0] : null;
  },

  async updateGoalCurrent(id, newCurrent) {
    if (!this.isConfigured()) return false;
    const { error } = await supabaseClient
      .from('goals')
      .update({ current: parseFloat(newCurrent) })
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar meta:', error);
      return false;
    }
    return true;
  },

  async deleteGoal(id) {
    if (!this.isConfigured()) return false;
    const { error } = await supabaseClient
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar meta:', error);
      return false;
    }
    return true;
  },

  /* --- PRESUPUESTOS --- */
  async getBudgets() {
    if (!this.isConfigured()) return null;
    const { data, error } = await supabaseClient
      .from('budgets')
      .select('*');

    if (error) {
      console.error('Error al obtener presupuestos:', error);
      return null;
    }
    
    // Convertir array de objetos [{category, amount}] a mapa {category: amount}
    const budgetsMap = {};
    data.forEach(item => {
      budgetsMap[item.category] = item.amount;
    });
    return budgetsMap;
  },

  async saveBudget(category, amount) {
    if (!this.isConfigured()) return false;
    const { error } = await supabaseClient
      .from('budgets')
      .upsert({ category, amount: parseFloat(amount) }, { onConflict: 'category' });

    if (error) {
      console.error('Error al guardar presupuesto:', error);
      return false;
    }
    return true;
  }
};
