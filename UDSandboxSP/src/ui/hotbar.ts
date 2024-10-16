import { InventoryUI } from "../scripts/inventory/inventory";
let inventoryOpen = false;

let hotbar: HTMLDivElement | null = null;

function createButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.innerText = label;
    button.style.padding = '10px';
    button.style.backgroundColor = '#555';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '3px';
    button.style.cursor = 'pointer';
    button.addEventListener('click', onClick);
    return button;
}

export default function HotbarUI() {
    if (!hotbar) {
        hotbar = document.createElement('div');
        hotbar.style.position = 'fixed';
        hotbar.style.bottom = '10px';
        hotbar.style.right = '10px';
        hotbar.style.backgroundColor = '#333';
        hotbar.style.padding = '10px';
        hotbar.style.borderRadius = '5px';
        hotbar.style.display = 'flex';
        hotbar.style.gap = '10px';

        document.body.appendChild(hotbar);
    }

    const button1 = createButton('Inventory', () => {
        if (inventoryOpen) {
            inventoryOpen = false;
            InventoryUI();
        } else {
            inventoryOpen = true;
            InventoryUI();
        }
    });

    const button2 = createButton('Chat', () => {
        alert('Chat Window Shit Here');
    });

    const button3 = createButton('Jobs', () => {
        alert('Job Window Shit Here');
    });

    hotbar.appendChild(button1);
    hotbar.appendChild(button2);
    hotbar.appendChild(button3);
}