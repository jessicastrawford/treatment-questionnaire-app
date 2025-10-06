// src/services/QuestionnaireService.ts
import { supabase } from "@/lib/supabase";

export class QuestionnaireService {
  async fetchQuestionnaire() {
    const { data, error } = await supabase.rpc("get_questionnaire_data");

    if (error) throw error;
    return data;
  }
}
