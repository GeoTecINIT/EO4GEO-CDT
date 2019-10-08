import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { BokInput } from '../model/bokinput';
import { Course } from './course.service';

const collection = 'modules';

export class Module extends Object {
  public _id: string;
  public name: string;
  public numSemester: number;
  public description: string;
  public ects: number;
  public assessment: string;
  public prerequisites: BokInput[];
  public learningObjectives: BokInput[];
  public courses: Course[];
  // --  public children = []; // needed for D3 nodes

  constructor(
    public currentNode: any = null
  ) {
    super();
    if (currentNode) {
      this._id = currentNode.data.id;
      this.name = currentNode.data.name;
      this.numSemester = currentNode.data.numSemester;
      this.description = currentNode.data.description;
      this.ects = currentNode.data.ects;
      this.assessment = currentNode.data.assessment;
      this.prerequisites = currentNode.data.prerequisites;
      this.learningObjectives = currentNode.data.learningObjectives;
      this.courses = currentNode.data.courses;

    } else {
      this._id = '';
      this.name = '';
      this.description = '';
      this.numSemester = 0;
      this.ects = 0;
      this.assessment = '';
      this.prerequisites = [];
      this.learningObjectives = [];
      this.courses = [];
    }
  }
}

@Injectable({
  providedIn: 'root'
})

export class ModuleService {
  private allModules: Module[];
  private _allModules: Module[];
  private db: AngularFirestore;

  constructor(db: AngularFirestore) {
    this.db = db;
    this.getAllModules();
  }

  subscribeToModules(): Observable<Module[]> {
    return this.db.collection<Module>(collection).valueChanges();
  }

  getAllModules() {
    this.subscribeToModules()
      .subscribe(m => (this.allModules = m, this._allModules = m));
  }

  filterModulesByNameDescription(txt) {
    /*
    return this.allModules.filter(function(el) {
         return el.name.toLowerCase().indexOf(txt.toLowerCase()) > -1;
     });
     */
  }

  getModuleById(moduleId: string): Observable<Module> {
    return this.db
      .collection(collection)
      .doc<Module>(moduleId)
      .valueChanges();
  }

  addNewModule(newMod: Module) {
    const id = this.db.createId();
    newMod._id = id;
    this.db
      .collection(collection)
      .doc(id)
      .set(newMod);
  }

  removeModule(moduleId: string) {
    this.db
      .collection(collection)
      .doc(moduleId)
      .delete();
  }

  updateModule(moduleId: string, updatedMod: Module) {
    this.db
      .collection(collection)
      .doc<Module>(moduleId)
      .update(updatedMod);
  }

}
