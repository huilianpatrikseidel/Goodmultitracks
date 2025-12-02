import React from 'react';
import { Settings, Music, Languages, Sliders } from 'lucide-react';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useLanguage } from '../lib/LanguageContext';
import { Language } from '../lib/translations';
import { useTheme } from '../lib/ThemeContext';
import { getMetronomeFrequencies, setMetronomeFrequencies, resetMetronomeFrequencies } from '../features/player/engine/metronome';
import { storage } from '../lib/localStorageManager';

// Metronome Sound Settings Component
function MetronomeSoundSettings() {
  const [frequencies, setFrequencies] = React.useState(getMetronomeFrequencies());

  const handleFrequencyChange = (type: 'strongBeat' | 'normalBeat' | 'subdivision', value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 100 && numValue <= 2000) {
      const updated = { ...frequencies, [type]: numValue };
      setFrequencies(updated);
      setMetronomeFrequencies(updated);
    }
  };

  const handleReset = () => {
    resetMetronomeFrequencies();
    setFrequencies(getMetronomeFrequencies());
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="strong-beat-freq" className="text-sm">
            Strong Beat Frequency (Hz)
          </Label>
          <Input
            id="strong-beat-freq"
            type="number"
            min="100"
            max="2000"
            value={frequencies.strongBeat}
            onChange={(e) => handleFrequencyChange('strongBeat', e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500">Default: 1000 Hz</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="normal-beat-freq" className="text-sm">
            Normal Beat Frequency (Hz)
          </Label>
          <Input
            id="normal-beat-freq"
            type="number"
            min="100"
            max="2000"
            value={frequencies.normalBeat}
            onChange={(e) => handleFrequencyChange('normalBeat', e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500">Default: 800 Hz</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="subdivision-freq" className="text-sm">
            Subdivision Frequency (Hz)
          </Label>
          <Input
            id="subdivision-freq"
            type="number"
            min="100"
            max="2000"
            value={frequencies.subdivision}
            onChange={(e) => handleFrequencyChange('subdivision', e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500">Default: 600 Hz</p>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={handleReset}
        className="w-full"
      >
        Reset to Defaults
      </Button>

      <p className="text-xs text-gray-500">
        Customize the frequencies used for different metronome clicks. Changes apply immediately.
      </p>
    </div>
  );
}

export function SettingsPanel() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-semibold mb-1">{t.appSettings}</h2>
        <p className="text-sm text-gray-600">Configure suas preferências da aplicação.</p>
      </div>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Languages className="w-5 h-5" />
            {t.appearance}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Theme */}
          <div className="space-y-1.5">
            <Label htmlFor="theme-select">{t.theme}</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t.light}</SelectItem>
                <SelectItem value="dark">{t.dark}</SelectItem>
                <SelectItem value="system">{t.system}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
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

      {/* Audio Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Music className="w-5 h-5" />
            {t.audio}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="audio-output-select">{t.audioOutput}</Label>
            <Select defaultValue="default">
              <SelectTrigger id="audio-output-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Padrão do Sistema</SelectItem>
                <SelectItem value="output-1">Saída Embutida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="click-output-select">Saída do Click/Guia</Label>
            <Select defaultValue="1">
              <SelectTrigger id="click-output-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Saída 1-2 (Main)</SelectItem>
                <SelectItem value="2">Saída 3-4</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Direcione o metrônomo e guias para uma saída separada (se disponível).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metronome Sound Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Music className="w-5 h-5" />
            Metronome Sound
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <MetronomeSoundSettings />
        </CardContent>
      </Card>

      {/* Player Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sliders className="w-5 h-5" />
            Player Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="track-height-select">Track Height</Label>
            <Select 
              defaultValue={storage.getTrackHeight()}
              onValueChange={(value) => {
                storage.setTrackHeight(value);
                window.dispatchEvent(new Event('storage'));
              }}
            >
              <SelectTrigger id="track-height-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Visible Rulers</Label>
            <div className="space-y-3 pl-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  defaultChecked={storage.getRulerVisibility('time')}
                  onCheckedChange={(checked) => {
                    storage.setRulerVisibility('time', !!checked);
                    window.dispatchEvent(new Event('storage'));
                  }}
                />
                Time Ruler
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  defaultChecked={storage.getRulerVisibility('measures')}
                  onCheckedChange={(checked) => {
                    storage.setRulerVisibility('measures', !!checked);
                    window.dispatchEvent(new Event('storage'));
                  }}
                />
                Measures Ruler
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  defaultChecked={storage.getRulerVisibility('sections')}
                  onCheckedChange={(checked) => {
                    storage.setRulerVisibility('sections', !!checked);
                    window.dispatchEvent(new Event('storage'));
                  }}
                />
                Sections Ruler
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  defaultChecked={storage.getRulerVisibility('chords')}
                  onCheckedChange={(checked) => {
                    storage.setRulerVisibility('chords', !!checked);
                    window.dispatchEvent(new Event('storage'));
                  }}
                />
                Chords Ruler
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  defaultChecked={storage.getRulerVisibility('tempo')}
                  onCheckedChange={(checked) => {
                    storage.setRulerVisibility('tempo', !!checked);
                    window.dispatchEvent(new Event('storage'));
                  }}
                />
                Tempo Ruler
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Toggle visibility of rulers in the player view.
            </p>
          </div>
        </CardContent>
      </Card>

       {/* About Section */}
       <Card>
           <CardHeader>
               <CardTitle className="flex items-center gap-2 text-lg">
                   <Settings className="w-5 h-5" />
                   {t.about}
               </CardTitle>
           </CardHeader>
           <CardContent className="pt-4 text-sm text-gray-700 space-y-1">
                <p><strong>GoodMultitracks</strong></p>
                <p>{t.version}: 0.1.0</p>
           </CardContent>
       </Card>

    </div>
  );
}
