import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'dat.gui';
import { Notify } from '../main/functions';
import { MessageType } from '../ui/notifications';
import { inventory, GetItemByName } from '../scripts/inventory/inventory';

export var stats = new Stats();
document.body.appendChild(stats.dom);

export function DevGUI() {
    const gui = new GUI();
    const NotifyFolder = gui.addFolder('Notifications');
    const InvFolder = gui.addFolder('Inventory');

    // Notifications
    const notifyParams = {
        title: '',
        message: '',
        type: "",
        duration: 3000,
        notify: function () {
            Notify(this.title, this.message, parseInt(this.duration.toString()), this.type as MessageType);
        }
    };

    NotifyFolder.add(notifyParams, 'title').name('Title');
    NotifyFolder.add(notifyParams, 'message').name('Message');
    NotifyFolder.add(notifyParams, 'type', ['info', 'warning', 'success', 'error']).name('Type');
    NotifyFolder.add(notifyParams, 'duration', 1000, 10000).name('Duration (ms)');
    NotifyFolder.add(notifyParams, 'notify').name('Send Notification');

    // Inventory
    const inventoryParams = {
        item: '',
        quantity: 1,
        removeitem: '',
        removequantity: 1,
        addItem: function () {
            const item = GetItemByName(this.item);
            if (item) {
                inventory.addItem(item.id, this.quantity);
            } else {
                console.error(`Item "${this.item}" not found`);
            }
        },
        removeItem: function () {
            const itemToRemove = GetItemByName(this.removeitem);
            if (itemToRemove) {
                inventory.removeItem(itemToRemove.id, this.removequantity);
            } else {
                console.error(`Item "${this.removeitem}" not found`);
            }
        }
    };

    InvFolder.add(inventoryParams, 'item').name('Item');
    InvFolder.add(inventoryParams, 'quantity', 1, 100).name('Quantity');
    InvFolder.add(inventoryParams, 'addItem').name('Add Item');

    InvFolder.add(inventoryParams, 'removeitem').name('Item');
    InvFolder.add(inventoryParams, 'removequantity', 1, 100).name('Quantity');
    InvFolder.add(inventoryParams, 'removeItem').name('Remove Item');
}