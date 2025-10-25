import React from 'react';
// Ícones removidos: Mic, Users, Bell, Smartphone
import { Settings, Music, Languages } from 'lucide-react';
import { Label } from './ui/label';
import { Switch } from './ui/switch'; // Switch não é mais usado, pode ser removido se não houver outras opções
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
// Separator não é mais usado, pode ser removido
// import { Separator } from './ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
// Button não é mais usado, pode ser removido
// import { Button } from './ui/button';
import { useLanguage } from '../lib/LanguageContext';
import { Language } from '../lib/translations';

export function SettingsPanel() {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-semibold mb-1">{t.appSettings}</h2> {/* Adicionado font-semibold e ajustado mb */}
        <p className="text-sm text-gray-600">Configure suas preferências da aplicação.</p> {/* Ajustado texto e tamanho */}
      </div>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"> {/* Ajustado tamanho do título */}
            <Languages className="w-5 h-5" />
            {t.appearance}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4"> {/* Adicionado pt-4 */}
          {/* Theme (Mantido como exemplo, pode ser removido se não necessário) */}
          <div className="space-y-1.5"> {/* Ajustado espaçamento */}
            <Label htmlFor="theme-select">{t.theme}</Label>
            <Select defaultValue="system" disabled> {/* Exemplo: desabilitado */}
              <SelectTrigger id="theme-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t.light}</SelectItem>
                <SelectItem value="dark">{t.dark}</SelectItem>
                <SelectItem value="system">{t.system}</SelectItem>
              </SelectContent>
            </Select>
             <p className="text-xs text-gray-500">Seleção de tema ainda não implementada.</p> {/* Info adicional */}
          </div>

          <div className="space-y-1.5"> {/* Ajustado espaçamento */}
            <Label htmlFor="language-select">{t.language}</Label>
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger id="language-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t.english}</SelectItem>
                <SelectItem value="pt">{t.portuguese}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audio Settings (Simplificado) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"> {/* Ajustado tamanho do título */}
            <Music className="w-5 h-5" />
            {t.audio}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4"> {/* Adicionado pt-4 */}
          <div className="space-y-1.5"> {/* Ajustado espaçamento */}
            <Label htmlFor="audio-output-select">{t.audioOutput}</Label>
            <Select defaultValue="default">
              <SelectTrigger id="audio-output-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Padrão do Sistema</SelectItem>
                <SelectItem value="output-1">Saída Embutida</SelectItem>
                {/* Adicionar mais opções dinamicamente se possível no futuro */}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5"> {/* Ajustado espaçamento */}
            <Label htmlFor="click-output-select">Saída do Click/Guia</Label>
            <Select defaultValue="1"> {/* Default para Main */}
              <SelectTrigger id="click-output-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Saída 1-2 (Main)</SelectItem>
                <SelectItem value="2">Saída 3-4</SelectItem>
                {/* Adicionar mais opções dinamicamente se possível */}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500"> {/* Tamanho de fonte ajustado */}
              Direcione o metrônomo e guias para uma saída separada (se disponível).
            </p>
          </div>

          {/* Opções Auto-gain e Pitch Shifting REMOVIDAS */}
          {/* <Separator /> */}
          {/* Opções removidas */}

        </CardContent>
      </Card>

      {/* Seção MIDI REMOVIDA */}
      {/* Seção Collaboration REMOVIDA */}
      {/* Seção Notifications REMOVIDA */}
      {/* Seção Display REMOVIDA */}

       {/* Seção Sobre (Opcional, mas comum) */}
       <Card>
           <CardHeader>
               <CardTitle className="flex items-center gap-2 text-lg">
                   <Settings className="w-5 h-5" /> {/* Ícone genérico */}
                   {t.about}
               </CardTitle>
           </CardHeader>
           <CardContent className="pt-4 text-sm text-gray-700 space-y-1">
                <p><strong>GoodMultitracks</strong></p>
                <p>{t.version}: 0.1.0 (Exemplo)</p>
                {/* Adicionar mais informações se desejar */}
           </CardContent>
       </Card>

    </div>
  );
}