import { Collection, Model } from 'backbone';
import { isArray } from 'underscore';

export class Selectable extends Model {}

export default class Selected extends Collection {
  getByComponent(component) {
    return this.filter(s => this.getComponent(s) === component)[0];
  }

  addComponent(component, opts) {
    //console.log('Selected.js => addComponent start');
    const toAdd = (isArray(component) ? component : [component])
      .filter(c => !this.hasComponent(c))
      .map(component => ({ component }));
    //console.log('Selected.js => addComponent end');
    return this.push(toAdd, opts);
  }

  getComponent(model) {
    return model.get('component');
  }

  hasComponent(component) {
    const model = this.getByComponent(component);
    return model && this.contains(model);
  }

  lastComponent() {
    const last = this.last();
    return last && this.getComponent(last);
  }

  allComponents() {
    return this.map(s => this.getComponent(s)).filter(i => i);
  }

  removeComponent(component, opts) {
    //console.log('Selected.js => removeComponent start');
    const toRemove = (isArray(component) ? component : [component]).map(c => this.getByComponent(c));
    //console.log('Selected.js => removeComponent end');
    return this.remove(toRemove, opts);
  }
}

Selected.prototype.model = Selectable;
