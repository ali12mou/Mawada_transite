import os

modules_dir = os.path.join('frontend', 'src', 'modules')

replacements = [
    ("import { FormLabel, FormInput, FormSelect, PrimaryButton, SecondaryButton } from './common/FormComponents'", "import { FormLabel, FormInput, FormSelect, PrimaryButton, SecondaryButton } from '../Shared/common/FormComponents'"),
    ("import Modal from './common/Modal'", "import Modal from '../Shared/common/Modal'"),
    ("import { ActionMenu } from './common/ActionMenu'", "import { ActionMenu } from '../Shared/common/ActionMenu'"),
    ("from '../contexts/", "from '../../contexts/"),
    ("from '../lib/", "from '../../lib/"),
    ("from '../types/", "from '../../types/"),
    ("from '../api/", "from '../../api/"),
    ("from '../constants/", "from '../../constants/"),
    ("from './common/Modal'", "from '../Shared/common/Modal'"),
    ("from './common/ActionMenu'", "from '../Shared/common/ActionMenu'"),
    ("from './common/FormComponents'", "from '../Shared/common/FormComponents'"),
]

for root, dirs, files in os.walk(modules_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                continue
            
            new_content = content
            for old, new in replacements:
                new_content = new_content.replace(old, new)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {path}')
