import { Component, OnInit, ViewChild, ElementRef, OnDestroy, HostListener, TemplateRef } from '@angular/core';
import { StudyProgram, StudyProgramService } from '../../services/studyprogram.service';
import { FieldsService } from '../../services/fields.service';
import { EscoCompetenceService, Competence } from '../../services/esco-competence.service';
import { ActivatedRoute } from '@angular/router';
import * as cv from '@eo4geo/curr-viz';
import { Module } from '../../services/module.service';
import { Course } from '../../services/course.service';
import { Lecture } from '../../services/lecture.service';
import { BokInput } from '../../model/bokinput';
import { AngularFireAuth } from '@angular/fire/auth';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { AngularFireAnalytics } from '@angular/fire/analytics';
import { Organization, OrganizationService } from '../../services/organization.service';
import { User, UserService } from '../../services/user.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import * as bok from '@eo4geo/find-in-bok-dataviz';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-newsp',
  templateUrl: './newsp.component.html',
  styleUrls: ['./newsp.component.scss']
})
export class NewspComponent implements OnInit, OnDestroy {

  competences = [];
  filteredCompetences = [];
  fullcompetences = [];

  model = null;
  modelModule = null;
  modelCourse = null;
  modelLecture = null;

  closeResult = '';

  /*   model = new StudyProgram();
    modelModule = new Module(null);
    modelCourse = new Course(null);
    modelLecture = new Lecture(null); */

  textByDepth = 'module';
  textByDepthRemove = 'study program';
  linkBoKto = 'name';
  customLO = '';
  customBib = '';
  textSaved = '';

  // public value: string[];
  // public current: string;

  highestItemLevel = -1;

  selectedSP: StudyProgram;
  _id: string;
  mode: string;
  title: string;

  selectedNodes = [];
  hasResults = false;
  limitSearchFrom = 0;
  limitSearchTo = 10;

  observer: MutationObserver;
  lastBoKTitle = 'GIST';

  searchInputField = '';

  currentConcept = 'GIST';

  isfullESCOcompetences = false;
  isSearchingExisting = false;
  isSearchingSpecific = false;
  isDisplayBoK = false;

  currentTreeNode = null;
  currentStudyProgram = null;

  allStudyPrograms: StudyProgram[];
  allItems: any[];

  filterText: String = '';
  filterTextAff: String = '';

  switchTitle = true;
  switchDescription = true;
  switchLO = true;
  switchPre = true;

  showMoreIndexSP = -1;
  showMoreIndexM = -1;
  showMoreIndexC = -1;
  showMoreIndexL = -1;

  depthSearching = 1;

  userOrgs: Organization[] = [];
  saveOrg: Organization;
  currentUser: User;
  userDivisions: string[] = [];
  saveDiv = '';

  isSaved = false;
  isSavedBB = false;
  isSavedBBText = 'Unit promoted and now available as independent educational offer - ';
  promotedId = '';
  levelPublic = true;

  otherUserEditingWarningText = '';

  reuseOrAnnotate = 'Re-use';

  configFields = {
    displayKey: 'concatName', // if objects array passed which key to be displayed defaults to description
    search: true, // true/false for the search functionlity defaults to false,
    height: '200px', // height of the list so that if there are more no of items it can show a scroll defaults to auto.
    placeholder: 'Select Field', // text to be displayed when no item is selected defaults to Select,
    customComparator: () => { }, // a custom function to sort the items. default is undefined and Array.sort() will be used
    noResultsFound: 'No results found!', // text to be displayed when no items are found while searching
    searchPlaceholder: 'Search Field', // label thats displayed in search input,
    searchOnKey: 'concatName' // key on which search should be performed. if undefined this will be extensive search on all keys
  };

  configCompetences = {
    displayKey: 'preferredLabel', // if objects array passed which key to be displayed defaults to description
    search: true, // true/false for the search functionlity defaults to false,
    height: '200px', // height of the list so that if there are more no of items it can show a scroll defaults to auto.
    placeholder: 'Select transversal skill', // text to be displayed when no item is selected defaults to Select,
    customComparator: () => { }, // a custom function to sort the items. default is undefined and Array.sort() will be used
    moreText: 'transversal skills more', // text to be displayed whenmore than one items are selected like Option 1 + 5 more
    noResultsFound: 'No results found!', // text to be displayed when no items are found while searching
    searchPlaceholder: 'Search transversal skills', // label thats displayed in search input,
    searchOnKey: 'preferredLabel' // key on which search should be performed. if undefined this will be extensive search on all keys
  };

  configfullCompetences = {
    displayKey: 'preferredLabel', // if objects array passed which key to be displayed defaults to description
    search: true, // true/false for the search functionlity defaults to false,
    height: '200px', // height of the list so that if there are more no of items it can show a scroll defaults to auto.
    placeholder: 'Select transversal skill', // text to be displayed when no item is selected defaults to Select,
    customComparator: () => { }, // a custom function to sort the items. default is undefined and Array.sort() will be used
    moreText: 'transversal skills more', // text to be displayed whenmore than one items are selected like Option 1 + 5 more
    noResultsFound: 'No results found!', // text to be displayed when no items are found while searching
    searchPlaceholder: 'Search transversal skills', // label thats displayed in search input,
    searchOnKey: 'preferredLabel' // key on which search should be performed. if undefined this will be extensive search on all keys
  };


  taxonomy = [
    {
      name: 'Remember',
      content: ['choose', 'define', 'find', 'identify', 'list', 'locate', 'name', 'recognize', 'relate', 'remember', 'select', 'state', 'write']
    },
    {
      name: 'Understand',
      content: [
        'cite', 'classify', 'compare', 'contrast', 'deliver', 'demonstrate', 'discuss', 'estimate', 'explain', 'illustrate', 'indicate',
        'interpret', 'outline', 'relate', 'report', 'review', 'understand'
      ]
    },
    {
      name: 'Apply',
      content: [
        'apply', 'build', 'calculate', 'choose', 'classify', 'construct', 'correlate', 'demonstrate', 'develop', 'identify', 'illustrate', 'implement', 'interpret',
        'model', 'organise', 'perform', 'plan', 'relate', 'represent', 'select', 'solve', 'teach', 'use'
      ]
    },
    {
      name: 'Analyze',
      content: [
        'analyse', 'arrange', 'choose', 'classify', 'compare', 'differentiate', 'distinguish', 'examine', 'find', 'install', 'list',
        'order', 'prioritize', 'query', 'research', 'select'
      ]
    },
    {
      name: 'Evaluate',
      content: [
        'assess', 'check', 'choose', 'compare', 'decide', 'defend', 'determine', 'estimate', 'evaluate', 'explain', 'interpret', 'judge', 'justify',
        'measure', 'prioritize', 'recommend', 'select', 'test', 'validate'
      ]
    },
    {
      name: 'Create',
      content: [
        'add to', 'build', 'change', 'choose', 'compile', 'construct', 'convert', 'create', 'design', 'develop', 'devise', 'discuss', 'estimate',
        'manage', 'model', 'modify', 'plan', 'process', 'produce', 'propose', 'revise', 'solve', 'test', 'transform'
      ]
    },
  ];

  modalRef: BsModalRef;


  @ViewChild('textBoK') textBoK: ElementRef;
  @ViewChild('graphTreeDiv') public graphTreeDiv: ElementRef;
  @ViewChild('bokModal') public bokModal: ModalDirective;

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event) {
    this.setEditing(false);
  }

  constructor(
    private studyprogramService: StudyProgramService,
    private organizationService: OrganizationService,
    private userService: UserService,
    public fieldsService: FieldsService,
    public escoService: EscoCompetenceService,
    private route: ActivatedRoute,
    private afAuth: AngularFireAuth,
    public analytics: AngularFireAnalytics,
    private modalService: BsModalService

  ) {
    this.competences = this.escoService.basicCompetences;
    this.filteredCompetences = this.escoService.basicCompetences;
    const allObs = this.studyprogramService
      .subscribeToStudyPrograms()
      .subscribe(res => {
        this.allStudyPrograms = res;
        // this is for the exploring existing
        this.exploreChildrenToAddItems();
        allObs.unsubscribe();
      });
    this.afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        this.userService.getUserById(user.uid).subscribe(userDB => {
          this.currentUser = new User(userDB);
          if (this.currentUser.organizations && this.currentUser.organizations.length > 0) {
            this.currentUser.organizations.forEach(orgId => {
              this.organizationService.getOrganizationById(orgId).subscribe(org => {
                if (org) {
                  this.userOrgs.push(org);
                  this.saveOrg = this.userOrgs[0];
                  this.setOrganization();
                  this.loadDivisions();
                } else { // this org has been deleted. remove
                  const indexToRemove = this.currentUser.organizations.indexOf(orgId);
                  if (indexToRemove !== -1) {
                    this.currentUser.organizations.splice(indexToRemove, 1);
                    this.userService.updateUserWithId(this.currentUser._id, this.currentUser);
                  }
                }
              });
            });
          }
        });
      }
    });
  }

  ngOnInit() {
    this.getMode();
    this.currentTreeNode = cv.getCurrentNode();
    const inputObject = {
      svgId: '#bubbles',
      textId: '#textBoK',
      urls: environment.URL_ARRAY
    };
    bok.visualizeBOKData(inputObject);
    this.analytics.logEvent('New Educational Offer', { 'mode': this.mode });

    this.observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if ((<any>mutation.target).children[1].innerText !== this.lastBoKTitle) {
          this.lastBoKTitle = (<any>mutation.target).children[1].innerText;
          this.hasResults = false;
        }
      });
    });
    const config = { attributes: true, childList: true, characterData: true };

    this.observer.observe(this.textBoK.nativeElement, config);

  }

  ngOnDestroy(): void {
    this.setEditing(false);
  }

  setEditing(bool) {
    if (this._id != null && this._id !== '') {
      this.studyprogramService.updateStudyProgramIsEdited(this._id, bool);
    }
  }

  saveStudyProgram() {
    let modelToSave = null;
    switch (this.highestItemLevel) {
      case 0:
        modelToSave = this.model;
        break;
      case 1:
        modelToSave = this.modelModule;
        break;
      case 2:
        modelToSave = this.modelCourse;
        break;
      case 3:
        modelToSave = this.modelLecture;
        break;
    }

    modelToSave.userId = this.afAuth.auth.currentUser.uid;
    modelToSave.orgId = this.saveOrg._id;
    modelToSave.orgName = this.saveOrg.name;
    modelToSave.levelPublic = this.levelPublic;
    modelToSave.division = this.saveDiv;

    if (this.mode === 'copy') {
      this.studyprogramService.updateStudyProgram(this._id, modelToSave);
    } else {
      this.studyprogramService.addNewStudyProgram(modelToSave);
    }
    this.isSaved = true;
    this.mode = 'copy'; // if it's second time editing change to
    this._id = modelToSave._id;
    this.refreshTreeSize();
    this.analytics.logEvent('Save Educational Offer', { 'mode': this._id });
  }

  saveCurrentNode() {
    let modelToSave = null;
    switch (this.currentTreeNode.depth + this.highestItemLevel) { // absolute depth
      case 0:
        modelToSave = this.model;
        break;
      case 1:
        modelToSave = this.modelModule;
        break;
      case 2:
        modelToSave = this.modelCourse;
        break;
      case 3:
        modelToSave = this.modelLecture;
        break;
    }

    if (!modelToSave) {
      switch (this.currentTreeNode.depth) { // absolute depth
        case 0:
          modelToSave = this.model;
          break;
        case 1:
          modelToSave = this.modelModule;
          break;
        case 2:
          modelToSave = this.modelCourse;
          break;
        case 3:
          modelToSave = this.modelLecture;
          break;
      }
    }

    switch (this.highestItemLevel) { // absolute depth
      case 0:
        modelToSave.affiliation = this.model.affiliation;
        modelToSave.eqf = this.model.eqf;
        break;
      case 1:
        modelToSave.affiliation = this.modelModule.affiliation;
        modelToSave.eqf = this.modelModule.eqf;
        break;
      case 2:
        modelToSave.affiliation = this.modelCourse.affiliation;
        modelToSave.eqf = this.modelCourse.eqf;
        break;
    }

    modelToSave.userId = this.afAuth.auth.currentUser.uid;
    modelToSave.orgId = this.saveOrg._id;
    modelToSave.orgName = this.saveOrg.name;
    modelToSave.levelPublic = this.levelPublic;

    this.promotedId = '' + this.studyprogramService.addNewStudyProgram(modelToSave);
    this.isSavedBB = true;

    this.analytics.logEvent('Promoted Educational Offer', { 'mode': this.promotedId });

  }

  saveBoKCodes(node) {
    node.linksToBok.forEach(l => {
      if (l.concept_id[0] === '[') {
        l.concept_id = l.name.split(']')[0].substring(1);
      }
    });
    if (node.children) {
      node.children.forEach(child => {
        this.saveBoKCodes(child);
      });
    }
    // sort by concept_id
    node.linksToBok.sort((a, b) => a.concept_id.localeCompare(b.concept_id));
  }

  getMode(): void {
    this.mode = this.route.snapshot.paramMap.get('mode');
    if (this.mode === 'duplicate' || this.mode === 'copy') {
      if (this.mode === 'copy') {
        this.title = 'Edit Educational Offer';
      } else {
        this.title = 'Duplicate Educational Offer';
      }
      this.fillForm();
    } else {
      this.title = 'Add New Educational Offer';
      this.displayTree();
    }
  }

  getStudyprogramId(): void {
    this._id = this.route.snapshot.paramMap.get('name');
    const spObs = this.studyprogramService
      .getStudyProgramById(this._id)
      .subscribe(sp => {
        this.selectedSP = sp;
        spObs.unsubscribe();
      });
  }

  fillForm(): void {
    this._id = this.route.snapshot.paramMap.get('name');
    if (this.mode === 'copy') {
      this.setEditing(true);
    }
    const spObs = this.studyprogramService
      .getStudyProgramById(this._id)
      .subscribe(sp => {
        this.isSaved = true;
        if (this.model == null) {
          this.model = sp;
          this.saveBoKCodes(this.model);
          switch (sp.depth) {
            case 0:
              this.model = sp;
              break;
            case 1:
              this.modelModule = sp;
              break;
            case 2:
              this.modelCourse = sp;
              break;
            case 3:
              this.modelLecture = sp;
              break;
          }
          this.highestItemLevel = this.model.depth;
          this.depthSearching = this.highestItemLevel + 1;
          this.levelPublic = this.model.levelPublic;
          this.setOrganization();
          this.displayTree(sp);

        } else {
          if (this.currentUser._id !== sp.userId) {
            // warn of other user editing it
            this.otherUserEditingWarningText = 'It looks like other user is editing this content. Despite the fact that automatic save is done frequently, some content may be lost.';
          }
        }
        spObs.unsubscribe(); // do not recieve more notifications
      });
  }

  setOrganization() {
    // iterate orgs to select right one
    if (this.userOrgs.length > 0 && this.currentUser && this.model) {
      this.userOrgs.forEach(o => {
        if (o._id === this.model.orgId) {
          this.saveOrg = o;
          this.loadDivisions();
        }
      });
    }
  }

  searchInBok(text: string) {
    if (text === '' || text === ' ') {
      this.cleanResults();
    } else {
      this.selectedNodes = bok.searchInBoK(text);
      this.hasResults = true;
      this.currentConcept = '';

      this.limitSearchFrom = 0;
      this.limitSearchTo = 10;
    }
  }

  navigateToConcept(conceptName) {
    bok.browseToConcept(conceptName);
    this.currentConcept = conceptName;
    this.hasResults = false;
  }

  cleanResults() {
    this.searchInputField = '';
    bok.searchInBoK('');
    this.navigateToConcept('GIST');
  }

  incrementLimit() {
    this.limitSearchTo = this.limitSearchTo + 10;
    this.limitSearchFrom = this.limitSearchFrom + 10;
  }

  decrementLimit() {
    this.limitSearchTo = this.limitSearchTo - 10;
    this.limitSearchFrom = this.limitSearchFrom - 10;
  }

  displayTree(program = null) {
    const width = this.graphTreeDiv.nativeElement.clientWidth > 0 ? this.graphTreeDiv.nativeElement.clientWidth : 400;
    if (program) {
      program.parent = null;
      program.proportions = [];
      program.r = 10;
      cv.displayCurricula('graphTree', program, width, 650);
      this.refreshCurrentNode();
    } else {
      cv.displayCurricula('graphTree', null, width, 650);
      this.currentTreeNode = cv.getCurrentNode();
    }
  }

  onResize() {
    // this.displayTree(this.model);
    this.refreshTreeSize();
  }

  refreshTreeSize() {
    if (this.currentTreeNode && this.currentTreeNode.data) {
      switch (this.highestItemLevel) {
        case 0:
          this.displayTree(this.model);
          break;
        case 1:
          this.displayTree(this.modelModule);
          break;
        case 2:
          this.displayTree(this.modelCourse);
          break;
        case 3:
          this.displayTree(this.modelLecture);
          break;
      }
    }
  }

  refreshCurrentNode() {
    this.isSearchingExisting = false;
    this.isSavedBB = false;
    this.currentTreeNode = cv.getCurrentNode();
    this.depthSearching = this.currentTreeNode.data.depth + 1;
    switch (this.currentTreeNode.data.depth) {
      case 0:
        this.textByDepth = 'module';
        this.textByDepthRemove = 'study program';
        this.model = new StudyProgram(this.currentTreeNode);
        break;
      case 1:
        this.textByDepth = 'course';
        this.textByDepthRemove = 'module';
        this.modelModule = new Module(this.currentTreeNode);
        break;
      case 2:
        this.textByDepth = 'lecture';
        this.textByDepthRemove = 'course';
        this.modelCourse = new Course(this.currentTreeNode);
        break;
      case 3:
        this.textByDepth = 'lecture';
        this.textByDepthRemove = 'lecture';
        this.currentTreeNode.children = null;
        this.modelLecture = new Lecture(this.currentTreeNode);
        break;
    }
  }

  addNodeInTree(depth) {
    if (this.highestItemLevel === -1) {
      this.highestItemLevel = depth;
      this.depthSearching = this.highestItemLevel + 1;
    }
    cv.addNewNodeWithDepth('New', depth);
    this.updateTreeStudyProgram();
    this.refreshCurrentNode();
  }

  addExistingToStudyProgram(node) {
    cv.addExistingNode(node);
    this.updateTreeStudyProgram();
    this.refreshCurrentNode();
  }

  removeNodeInTree() {
    this.isSaved = false;
    this.isSavedBB = false;
    cv.removeSelectedNode();
  }

  updateNodeInTree(node) {
    cv.updateNode(node);
  }

  updateTreeStudyProgram() {
    this.isSaved = false;
    this.isSavedBB = false;
    if (this.currentTreeNode && this.currentTreeNode.data) {
      switch (this.currentTreeNode.data.depth) {
        case 0:
          this.updateNodeInTree(this.model);
          break;
        case 1:
          this.updateNodeInTree(this.modelModule);
          break;
        case 2:
          this.updateNodeInTree(this.modelCourse);
          break;
        case 3:
          this.updateNodeInTree(this.modelLecture);
          break;
      }
    }
  }

  addBokKnowledge() {
    const concept = this.textBoK.nativeElement.getElementsByTagName('h4')[0]
      .textContent;
    const conceptId = concept.split(']')[0].substring(1);
    const newConcept = new BokInput('', concept, conceptId, '', [], '', []);

    const divs = this.textBoK.nativeElement.getElementsByTagName('div');
    if (divs['bokskills'] != null) {
      const shortCode = this.textBoK.nativeElement.getElementsByTagName('h4')[0].innerText.split(' ')[0];
      const as = divs['bokskills'].getElementsByTagName('li');
      for (const skill of as) {
        newConcept.skills.push(skill.innerText);
      }
    }
    if (divs['boksource'] != null) {
      const shortCode = this.textBoK.nativeElement.getElementsByTagName('h4')[0].innerText.split(' ')[0];
      const as = divs['boksource'].getElementsByTagName('li');
      for (const bib of as) {
        newConcept.bibliography.push(bib.innerText);
      }
    }
    console.log(newConcept.bibliography);
    let modelToUpdate;
    switch (this.currentTreeNode.data.depth) {
      case 0:
        modelToUpdate = this.model;
        break;
      case 1:
        modelToUpdate = this.modelModule;
        break;
      case 2:
        modelToUpdate = this.modelCourse;
        break;
      case 3:
        modelToUpdate = this.modelLecture;
        break;
    }

    switch (this.linkBoKto) {
      case 'name':
        newConcept.linkedTo = 'name';
        modelToUpdate[this.linkBoKto] = modelToUpdate[this.linkBoKto] + ' ' + concept;
        break;
      case 'description':
        // tslint:disable-next-line:max-line-length
        const desc = divs['currentDescription'].textContent;
        newConcept.linkedTo = 'description';
        modelToUpdate[this.linkBoKto] = modelToUpdate[this.linkBoKto] + ' ' + desc;  // currentDescription
        break;
      case 'prerequisites':
        newConcept.linkedTo = 'prerequisites';
        if (!modelToUpdate.prerequisites.includes(newConcept)) {
          modelToUpdate.prerequisites.push(newConcept);
        }
        break;
      case 'learningObjectives':
        newConcept.linkedTo = 'learningObjectives';
        let loFound = false;
        modelToUpdate.learningObjectives.forEach( lo => {
          if ( newConcept.concept_id == lo.concept_id ) {
            loFound = true;
          }
        });
        if (!loFound) {
          newConcept.skills.forEach(sk => {
            const newSkill = new BokInput('', sk, newConcept.concept_id, '', [], 'learningObjectives', []);
            modelToUpdate.learningObjectives.push(newSkill);
          });
        }
        break;
      case 'bibliography':
        newConcept.linkedTo = 'bibliography';
        if (!modelToUpdate.bibliography.includes(newConcept)) {
          newConcept.bibliography.forEach(bib => {
            const newBib = new BokInput('', bib, newConcept.concept_id, '', [], 'bibliography', []);
            modelToUpdate.bibliography.push(newBib);
          });
        }
        break;
      default:
        newConcept.linkedTo = 'general';
        break;
    }
    let found = false;
    modelToUpdate.linksToBok.forEach(c => {
      if (c.concept_id === newConcept.concept_id) {
        found = true;
      }
    });

    if (!found) {
      modelToUpdate.linksToBok.push(newConcept);
      modelToUpdate.concepts.push(newConcept.name);
    }

    this.bokModal.hide();
    this.updateTreeStudyProgram();
  }

  removeBokKnowledge(model, index, attrTxt) {
    console.log('remove ')
    model[attrTxt].splice(index, 1);
    model.concepts.splice(index, 1);
    this.updateTreeStudyProgram();
  }

  addCustomLO(model) {
    model.learningObjectives.push(new BokInput('', this.customLO, this.customLO, '', [], '', []));
    this.customLO = '';
  }

  addCustomBib(model) {
    model.bibliography.push(new BokInput('', this.customBib, this.customBib, '', [], '', []));
    this.customBib = '';
  }

  showExistingToStudyProgram(node) {
    this.currentStudyProgram = node;
  }

  exploreChildrenToAddItems() {
    this.allItems = [];
    this.allStudyPrograms.forEach(s => {
      if (s.fields == null && s.field != null) {
        s.fields = [];
        s.fields.push(s.field);
      }
      this.allItems.push(s);
      if (s.children) {
        s.children.forEach(m => {
          m.affiliation = s.affiliation; // propagate affiliation and eqf to children
          m.eqf = s.eqf;
          m.field = s.field;
          this.allItems.push(m);
          if (m.children) {
            m.children.forEach(c => {
              c.affiliation = s.affiliation; // propagate affiliation and eqf to children
              c.eqf = s.eqf;
              c.field = s.field;
              this.allItems.push(c);
              if (c.children) {
                c.children.forEach(l => {
                  l.affiliation = s.affiliation; // propagate affiliation and eqf to children
                  l.eqf = s.eqf;
                  l.field = s.field;
                  this.allItems.push(l);
                });
              }
            });
          }
        });
      }
    });
    this.allItems.sort((left, right) => {
      if (left.name < right.name) { return -1; }
      if (left.name > right.name) { return 1; } else { return 0; }
    });
    this.analytics.logEvent('Explore Educational Offer', { 'mode': this.mode });
  }

  listSorted(result) {
    this.currentTreeNode.children = result;
    this.updateTreeStudyProgram();
    // this.refreshTreeSize();
  }

  // Add custom competence to model to force updating component, and to competences lists to find it again if removed
  addExtraCompetence(comp, modelToAdd) {
    modelToAdd.competences = [...modelToAdd.competences, { preferredLabel: comp, reuseLevel: 'custom' }];
    this.competences = [...this.competences, { preferredLabel: comp, reuseLevel: 'custom' }];
    modelToAdd.customCompetences.push(comp);
    this.escoService.allcompetences = [...this.escoService.allcompetences, { preferredLabel: comp, reuseLevel: 'custom' }];
    this.escoService.basicCompetences = [...this.escoService.basicCompetences, { preferredLabel: comp, reuseLevel: 'custom', uri: null }];

    this.updateTreeStudyProgram();
  }

  removeCompetence(name: string, array: string[]) {

    array.forEach((item, index) => {
      if (item === name) {
        array.splice(index, 1);
      }
    });

    // update model selects
    if (this.model) {
      this.model.competences = [...this.model.competences];
    }
    if (this.modelModule) {
      this.modelModule.competences = [...this.modelModule.competences];
    }
    if (this.modelCourse) {
      this.modelCourse.competences = [...this.modelCourse.competences];
    }
    if (this.modelLecture) {
      this.modelLecture.competences = [...this.modelLecture.competences];
    }
  }

  updateFields() {
    // update model selects
    if (this.model) {
      this.model.fields = [...this.model.fields];
    }
    if (this.modelModule) {
      this.modelModule.fields = [...this.modelModule.fields];
    }
    if (this.modelCourse) {
      this.modelCourse.fields = [...this.modelCourse.fields];
    }
    if (this.modelLecture) {
      this.modelLecture.fields = [...this.modelLecture.fields];
    }
  }

  fullListESCO() {
    this.isfullESCOcompetences = !this.isfullESCOcompetences;
  }

  // custom search to match term also in altLabels
  customSearchFn(term: string, item: Competence) {
    let found = false;
    if (term) {
      term = term.toLocaleLowerCase();
      if (item.preferredLabel.toLocaleLowerCase().indexOf(term) > -1) {
        found = true;
      }
      if (item.altLabels && item.altLabels.length > 0) {
        item.altLabels.forEach((alt) => {
          if (alt.toLocaleLowerCase().indexOf(term) > -1) {
            found = true;
          }
        });
      }
    }
    return found;
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template, { class: 'modal-lg' });
  }

  loadDivisions() {
    this.userDivisions = this.saveOrg.divisions ? this.saveOrg.divisions : [];
    this.saveDiv = this.model ? this.model.division ? this.model.division : '' : '';
  }

}
