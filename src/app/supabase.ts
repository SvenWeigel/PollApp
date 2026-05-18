import { Injectable, signal, } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { Survey } from './shared/interface/survey.interface';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

  surveys = signal<Survey[]>([]);

  async getSurveys() {
    let { data: surveys } = await this.supabase
    .from('surveys')
    .select('*');
    if(!surveys) return;
    this.surveys.set(surveys);
  }
}
