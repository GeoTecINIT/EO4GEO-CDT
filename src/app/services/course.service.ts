import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { BokInput } from '../model/bokinput';
import { Lecture } from './lecture.service';

const collection = 'courses';

export class Course extends Object {

  public _id: string;
  public name: string;
  public numSemester: number;
  public description: string;
  public ects: number;
  public assessment: string;
  public bibliography: string;
  public prerequisites: BokInput [];
  public learningObjectives: BokInput [];
  public children: Lecture[];
  public concepts: string[];
  public linksToBok: BokInput[];
  public depth = 2;
  public userId: string;
  public affiliation: string;
  public levelPublic: Boolean;
  public eqf: number;

  data: any;

  constructor(
    public currentNode: any = null
  ) {
    super();
    if (currentNode) {
      this._id = currentNode.data._id ? currentNode.data._id : '';
      this.name = currentNode.data.name ? currentNode.data.name : '';
      this.numSemester = currentNode.data.numSemester ? currentNode.data.numSemester : 0;
      this.description = currentNode.data.description ? currentNode.data.description : '';
      this.ects = currentNode.data.ects ? currentNode.data.ects : 0;
      this.assessment  = currentNode.data.assessment ? currentNode.data.assessment : '';
      this.bibliography  = currentNode.data.bibliography ? currentNode.data.bibliography : '';
      this.prerequisites = currentNode.data.prerequisites ? currentNode.data.prerequisites : [];
      this.learningObjectives = currentNode.data.learningObjectives ? currentNode.data.learningObjectives : [];
      this.children = currentNode.children ? currentNode.children : [];
      this.concepts = currentNode.data.concepts ? currentNode.data.concepts : [];
      this.currentNode = null;
      this.linksToBok = currentNode.data.linksToBok ? currentNode.data.linksToBok : [];
      this.userId = currentNode.data.userId ? currentNode.data.userId : '';
      this.affiliation = currentNode.data.affiliation ? currentNode.data.affiliation : '';
      this.levelPublic = currentNode.data.levelPublic ? currentNode.data.levelPublic : true;
      this.eqf = currentNode.data.eqf ? currentNode.data.eqf : 0;

    } else {
      this._id = '';
      this.name = '';
      this.numSemester = 0;
      this.description = '';
      this.ects = 0;
      this.assessment = '';
      this.bibliography = '';
      this.prerequisites = [];
      this.learningObjectives = [];
      this.children = [];
      this.concepts = [];
      this.linksToBok = [];
      this.userId = '';
      this.affiliation = '';
      this.levelPublic = true;
      this.eqf = 0;
    }
  }
}
/*
@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private db: AngularFirestore;
  constructor(db: AngularFirestore) {
    this.db = db;
  }

  subscribeToCourses(): Observable<Course[]> {
    return this.db.collection<Course>(collection).valueChanges();
  }

  getCourseById(courseId: string): Observable<Course> {
    return this.db
      .collection(collection)
      .doc<Course>(courseId)
      .valueChanges();
  }

  addNewCourse(newCourse: Course) {
    const id = this.db.createId();
    newCourse._id = id;
    this.db
      .collection(collection)
      .doc(id)
      .set(newCourse);
  }

  removeCourse(courseId: string) {
    this.db
      .collection(collection)
      .doc(courseId)
      .delete();
  }

  updateCourse(courseId: string, updatedCourse: Course) {
    this.db
      .collection(collection)
      .doc<Course>(courseId)
      .update(updatedCourse);
  }
}
 */