#!/usr/bin/env python3
"""
Script completo para padronizar todas as cores #404040 para var(--daw-control)
em todos os arquivos da aplicação GoodMultitracks.
"""

import os

def fix_colors():
    """Substitui todas as ocorrências de '#404040' por 'var(--daw-control)'"""
    
    files_to_fix = [
        'features/player/components/DAWPlayer.tsx',
        'components/PlaybackControls.tsx',
        'components/TrackTagSelector.tsx'
    ]
    
    total_replacements = 0
    
    print("🎨 Padronização de Cores - GoodMultitracks")
    print("=" * 50)
    print()
    
    for file_path in files_to_fix:
        if not os.path.exists(file_path):
            print(f"⚠️  Arquivo não encontrado: {file_path}")
            continue
        
        try:
            # Ler arquivo
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Contar antes
            before_count = content.count("'#404040'")
            
            if before_count == 0:
                print(f"✓  {file_path}")
                print(f"   Nenhuma substituição necessária")
                print()
                continue
            
            # Substituir
            content = content.replace("'#404040'", "'var(--daw-control)'")
            
            # Escrever de volta
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            total_replacements += before_count
            
            print(f"✅ {file_path}")
            print(f"   {before_count} substituição(ões) realizada(s)")
            print()
            
        except Exception as e:
            print(f"❌ Erro ao processar {file_path}: {e}")
            print()
    
    print("=" * 50)
    print(f"🎉 Concluído! Total: {total_replacements} substituições")
    print()
    print("Próximos passos:")
    print("1. Verificar visualmente os arquivos alterados")
    print("2. Testar a aplicação")
    print("3. Fazer commit das alterações")

if __name__ == "__main__":
    fix_colors()
