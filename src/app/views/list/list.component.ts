import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef,  TemplateRef } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { NgForOf } from '@angular/common';
import { Observable, Subscription } from 'rxjs';

import { StudyProgramService, StudyProgram } from '../../services/studyprogram.service';
import { FormControl } from '@angular/forms';
import { ModalDirective, ModalOptions } from 'ngx-bootstrap/modal';
import { AngularFireAuth } from '@angular/fire/auth';
import { SlicePipe } from '@angular/common';
import { User, UserService } from '../../services/user.service';
import { OrganizationService, Organization } from '../../services/organization.service';
import { ActivatedRoute } from '@angular/router';
import * as cloneDeep from 'lodash/cloneDeep';
import * as bok from '@eo4geo/find-in-bok-dataviz';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  studyPrograms: StudyProgram[];
  organizations: Organization[];
  filterOrg: Organization = null;
  advancedSearch = false;
  affiliationFilter = false;
  knowledgeFilter = false;
  skillFilter = false;
  fieldFilter = false;
  filteredStudyPrograms: any[];
  searchText = '';
  isAnonymous = null;
  ownUsrId = null;
  showOnlyDepth = -1;
  showOnlyAuthor = -1;
  currentUser: User;

  sortNameAsc = true;
  sortOrgAsc = true;
  sortUpdAsc = true;
  sortedBy = 'lastUpdated';

  customSelect = 0;
  hasResults = false;
  limitSearchFrom = 0;
  limitSearchTo = 10;
  searchInputField = '';
  currentConcept = 'GIST';
  buttonClear = 0;

  selectedNodes = [];
  conceptsToSearch = [];

  isFiltered = false;
  filterClean = false;

  spFilterDepth = [];
  spFilterAuthor = [];
  spFilterPrivate = [];

  public paginationLimitFrom = 0;
  public paginationLimitTo = 6;
  public LIMIT_PER_PAGE = 6;
  public currentPage = 0;
  public BOK_PERMALINK_PREFIX = 'https://bok.eo4geo.eu/';

  @ViewChild('dangerModal') public dangerModal: ModalDirective;
  @ViewChild('releaseNotesModal') public releaseNotesModal: any;
  @ViewChild('bokModal') public bokModal: ModalDirective;
  @ViewChild('textBoK') textBoK: ElementRef;

  constructor(private studyprogramService: StudyProgramService,
    private userService: UserService,
    public organizationService: OrganizationService,
    private route: ActivatedRoute,
    public afAuth: AngularFireAuth) {
    this.afAuth.auth.onAuthStateChanged(user => {
      if (user) {
        this.isAnonymous = user.isAnonymous;
        this.ownUsrId = user.uid;
        this.userService.getUserById(user.uid).subscribe(userDB => {
          this.currentUser = new User(userDB);
        });
      } else {
        this.isAnonymous = true;
        this.ownUsrId = null;
      }
    });
    this.organizationService.subscribeToOrganizations().subscribe(orgs => {
      let allOrgsWithDiv = [];
      orgs.forEach(o => {
        let copyOrg = cloneDeep(o);
        copyOrg.description = o.name;
        allOrgsWithDiv.push(copyOrg);
        if (o.divisions) {
          o.divisions.forEach(d => {
            let copyOrg = cloneDeep(o);
            copyOrg.description = o.name + ' - ' + d;
            allOrgsWithDiv.push(copyOrg);
          });
        }
      });

      //  this.organizations = allOrgsWithDiv;
      this.organizations = allOrgsWithDiv.sort((a, b) => (a.name.trim().toLowerCase() > b.name.trim().toLowerCase()) ? 1 : -1);
    });
  }

  ngOnInit() {
    this.studyprogramService
      .subscribeToStudyPrograms()
      .subscribe(studyPrograms => {
        this.studyPrograms = studyPrograms;

        /*  this.studyPrograms.forEach(sp => {
           console.log('Educational offer: ' + sp.name + ' - id: ' + sp._id);
           if (sp.competences) {
             sp.competences.forEach(comp => {
               console.log('Competence: ' + comp.preferredLabel + ' - URI: ' + comp.uri + ' - reuse level: ' + comp.reuseLevel);
             });
           }
         });
  */
        this.filterAll();
        this.sortSPby(this.sortedBy);
      });

    if (this.route.snapshot.url[0].path === 'release-notes') {
      const config: ModalOptions = { backdrop: true, keyboard: true };
      this.releaseNotesModal.basicModal.config = config;
      this.releaseNotesModal.basicModal.show({});
    }
    const inputObject = {
      svgId: '#bubbles',
      textId: '#textBoK',
      urls: environment.URL_ARRAY
    };
    bok.visualizeBOKData(inputObject);
  }

  removeStudyProgram(id: string) {
    this.studyprogramService.removeStudyProgram(id);
  }

  sortSPby(attr) {
    this.paginationLimitFrom = 0;
    this.paginationLimitTo = 6;
    this.currentPage = 0;
    switch (attr) {
      case 'name':
        this.sortNameAsc = !this.sortNameAsc;
        this.sortedBy = 'name';
        this.filteredStudyPrograms.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? this.sortNameAsc ? 1 : -1 : this.sortNameAsc ? -1 : 1);
        break;
      case 'lastUpdated':
        this.sortUpdAsc = !this.sortUpdAsc;
        this.sortedBy = 'lastUpdated';
        this.filteredStudyPrograms.sort((a, b) => (a.updatedAt > b.updatedAt) ? this.sortUpdAsc ? 1 : -1 : this.sortUpdAsc ? -1 : 1);
        break;
      case 'organization':
        this.sortOrgAsc = !this.sortOrgAsc;
        this.sortedBy = 'organization';
        this.filteredStudyPrograms.sort((a, b) => (a.orgName.toLowerCase() > b.orgName.toLowerCase()) ? this.sortOrgAsc ? 1 : -1 : this.sortOrgAsc ? -1 : 1);
        break;
      case 'eqf':
        this.sortOrgAsc = !this.sortOrgAsc;
        this.sortedBy = 'eqf';
        this.filteredStudyPrograms.sort((a, b) => (a.eqf > b.eqf) ? this.sortOrgAsc ? 1 : -1 : this.sortOrgAsc ? -1 : 1);
        break;
    }
  }

  filter() {
    this.paginationLimitFrom = 0;
    this.paginationLimitTo = 6;
    this.currentPage = 0;
    this.studyPrograms.forEach(sp => {
      if (!sp.division) {
        sp.division = '';
      }
    });
    const search = this.searchText.toLowerCase();
    this.filteredStudyPrograms = [];
    if (this.advancedSearch) {
      this.applyFilters();
    } else {
      this.filteredStudyPrograms = this.studyPrograms.filter(
        it =>
          it.name.toLowerCase().includes(search) ||
          it.description.toLowerCase().includes(search) ||
          it.orgName.toLowerCase().includes(search) ||
          it.division.toLowerCase().includes(search)
      );
      if ( search.length > 0 ) {
        this.isFiltered = true;
      } else {
        this.isFiltered = this.isFiltered ? true : false;
      }
    }

  }

  filterByPrivate() {
    if (!this.currentUser) {
      this.filteredStudyPrograms = this.filteredStudyPrograms.filter(
        it =>
          it.levelPublic
      );
    } else {
      this.filteredStudyPrograms = this.filteredStudyPrograms.filter(
        sp =>
          sp.userId === this.currentUser._id ||
          sp.levelPublic ||
          (this.currentUser.organizations.indexOf(sp.orgId) > -1)
      );
    }
    this.isFiltered = this.isFiltered ? true : false;
  }

  applyFilters() {
    this.studyPrograms.forEach(sp => {
      if (!this.affiliationFilter && !this.knowledgeFilter && !this.skillFilter && !this.fieldFilter || this.searchText === '') {
        // if no filters checked, return all
        this.advancedSearch = false;
        this.filter();
      } else {
        if (this.affiliationFilter) {
          if (sp.affiliation.toLowerCase().includes(this.searchText.toLowerCase())) {
            if (this.filteredStudyPrograms.indexOf(sp) === -1) {
              this.filteredStudyPrograms.push(sp);
            }
          }
        }
        if (this.knowledgeFilter || this.skillFilter) {
          sp.linksToBok.forEach(link => {  // Study program links
            if (this.knowledgeFilter) {
              if (link.concept_id.toLowerCase().includes(this.searchText.toLowerCase())) {
                if (this.filteredStudyPrograms.indexOf(sp) === -1) {
                  this.filteredStudyPrograms.push(sp);
                }
              }
            }
            if (this.skillFilter) {
              link.skills.forEach(sk => {
                if (sk.toLowerCase().includes(this.searchText.toLowerCase())) {
                  if (this.filteredStudyPrograms.indexOf(sp) === -1) {
                    this.filteredStudyPrograms.push(sp);
                  }
                }
              });
            }
          });
        }
        if (sp.children) {
          sp.children.forEach(mod => {
            mod.linksToBok.forEach(linkM => { // Module links
              if (this.knowledgeFilter) {
                if (linkM.concept_id.toLowerCase().includes(this.searchText.toLowerCase())) {
                  if (this.filteredStudyPrograms.indexOf(sp) === -1) {
                    this.filteredStudyPrograms.push(sp);
                  }
                }
              }
              if (this.skillFilter) {
                linkM.skills.forEach(sk => {
                  if (sk.toLowerCase().includes(this.searchText.toLowerCase())) {
                    if (this.filteredStudyPrograms.indexOf(sp) === -1) {
                      this.filteredStudyPrograms.push(sp);
                    }
                  }
                });
              }
            });
            if (mod.children) {
              mod.children.forEach(cour => {
                cour.linksToBok.forEach(linkC => { // Course links
                  if (this.knowledgeFilter) {
                    if (linkC.concept_id.toLowerCase().includes(this.searchText.toLowerCase())) {
                      if (this.filteredStudyPrograms.indexOf(sp) === -1) {
                        this.filteredStudyPrograms.push(sp);
                      }
                    }
                  }
                  if (this.skillFilter) {
                    linkC.skills.forEach(sk => {
                      if (sk.toLowerCase().includes(this.searchText.toLowerCase())) {
                        if (this.filteredStudyPrograms.indexOf(sp) === -1) {
                          this.filteredStudyPrograms.push(sp);
                        }
                      }
                    });
                  }
                });
                if (cour.children) {
                  cour.children.forEach(lect => {
                    lect.linksToBok.forEach(linkL => { // Lecture links
                      if (this.knowledgeFilter) {
                        if (linkL.concept_id.toLowerCase().includes(this.searchText.toLowerCase())) {
                          if (this.filteredStudyPrograms.indexOf(sp) === -1) {
                            this.filteredStudyPrograms.push(sp);
                          }
                        }
                      }
                      if (this.skillFilter) {
                        linkL.skills.forEach(sk => {
                          if (sk.toLowerCase().includes(this.searchText.toLowerCase())) {
                            if (this.filteredStudyPrograms.indexOf(sp) === -1) {
                              this.filteredStudyPrograms.push(sp);
                            }
                          }
                        });
                      }
                    });
                  });
                }
              });
            }
          });
        }
        if (this.fieldFilter) {
          // tslint:disable-next-line:max-line-length
          if (sp.field.name.toLowerCase().includes(this.searchText.toLowerCase()) || sp.field.parent.toLowerCase().includes(this.searchText.toLowerCase())) {
            if (this.filteredStudyPrograms.indexOf(sp) === -1) {
              this.filteredStudyPrograms.push(sp);
            }
          }
        }
      }
    });
  }

  filterByDepth(depth) {
    this.paginationLimitFrom = 0;
    this.paginationLimitTo = 6;
    this.currentPage = 0;
    if (depth > -1) {
      this.filteredStudyPrograms = this.filteredStudyPrograms.filter(
        it =>
          it.depth === depth
      );
      this.isFiltered = true;
      this.spFilterDepth = this.filteredStudyPrograms;
    } else {
      this.isFiltered = this.isFiltered ? true : false;
      this.spFilterDepth = [];
    }
  }

  filterByAuthor(author) {
    this.paginationLimitFrom = 0;
    this.paginationLimitTo = 6;
    this.currentPage = 0;
    if (author === 0) { // mine
      this.filterOrg = null;
      this.filteredStudyPrograms = this.filteredStudyPrograms.filter(
        it =>
          it.userId === this.currentUser._id
      );
      this.isFiltered = true;
      this.spFilterAuthor = this.filteredStudyPrograms;
    } else if (this.filterOrg && author === 1) { // my orgs
      let filter = [];
      this.filteredStudyPrograms.forEach(sp => {
        if (sp.orgId === this.filterOrg._id) {
          if (this.filterOrg.description.indexOf(' - ') > -1) {
            if (sp.division && sp.division === this.filterOrg.description.split(' - ')[1]) {
              filter.push(sp);
            }
          } else {
            filter.push(sp);
          }
        }
      });

      this.filteredStudyPrograms = filter;
      this.isFiltered = true;
      this.spFilterAuthor = this.filteredStudyPrograms;
    } else if (author === -1) { // all
      this.filterOrg = null;
      this.isFiltered = this.isFiltered ? true : false;
      this.spFilterAuthor = [];
    }
  }

  filterAll() {
    this.filter();
    this.filterByPrivate();
    this.filterByAuthor(this.showOnlyAuthor);
    this.filterByDepth(this.showOnlyDepth);
    if ( this.conceptsToSearch.length > 0  && !this.filterClean ) {
      this.filterByBokConcept();
    }
  }

  range(size, startAt = 0) {
    size = Math.ceil(size);
    if (size === 0) {
      size = 1;
    }
    return [...Array(size).keys()].map(i => i + startAt);
  }

  nextPage() {
    if (this.currentPage + 1 < this.filteredStudyPrograms.length / this.LIMIT_PER_PAGE) {
      this.paginationLimitFrom = this.paginationLimitFrom + this.LIMIT_PER_PAGE;
      this.paginationLimitTo = this.paginationLimitTo + this.LIMIT_PER_PAGE;
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.paginationLimitFrom = this.paginationLimitFrom - this.LIMIT_PER_PAGE;
      this.paginationLimitTo = this.paginationLimitTo - this.LIMIT_PER_PAGE;
      this.currentPage--;
    }
  }

  cleanResults() {
    this.searchInputField = '';
    bok.searchInBoK('');
    this.navigateToConcept('GIST');
  }

  navigateToConcept(conceptName) {
    bok.browseToConcept(conceptName);
    console.log('Current concept: ' + conceptName);
    this.currentConcept = conceptName;
    this.hasResults = false;
  }

  incrementLimit() {
    this.limitSearchTo = this.limitSearchTo + 10;
    this.limitSearchFrom = this.limitSearchFrom + 10;
  }

  decrementLimit() {
    this.limitSearchTo = this.limitSearchTo - 10;
    this.limitSearchFrom = this.limitSearchFrom - 10;
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
  addBokConcept() {
    const concept = this.textBoK.nativeElement.getElementsByTagName('h4')[0]
      .textContent;
    const conceptId = concept.split(']')[0].substring(1);
    let itExist = false;
    this.conceptsToSearch.forEach( cpt => {
      if ( cpt.code == conceptId) itExist = true;
    });
    if ( !itExist ) {
      this.conceptsToSearch.push({ code: conceptId, name: concept });
    }
    this.filterByBokConcept();
  }
  removeConceptSelected(concept) {
    const index = this.conceptsToSearch.indexOf(concept);
    this.conceptsToSearch.splice(index, 1);
    this.filterClean = this.conceptsToSearch.length == 0 ? true : false ;
    this.filterByBokConcept();
  }

  filterByBokConcept() {
    this.paginationLimitFrom = 0;
    this.paginationLimitTo = 6;
    this.currentPage = 0;

    //check if the complete selection was removed
    if ( this.filterClean ) {
      this.filteredStudyPrograms = this.studyPrograms;
    }
    //Check if the filter by depth is active
    if ( this.spFilterDepth.length > 0 && this.conceptsToSearch.length == 0 ) {
      this.filteredStudyPrograms = this.spFilterDepth;
    }
    let toFilter = this.isFiltered ? this.filteredStudyPrograms : this.studyPrograms;
    for ( let node of this.conceptsToSearch ) {
      let found = false;
      let filteredConcepts = [];
      toFilter.forEach(sp => {
        sp.linksToBok.forEach( cpt => {
          let code = '';
          if ( cpt.concept_id.split(']').length >= 1  ) {
            code = cpt.concept_id.split(']')[0].split('[')[1];
          } else {
            code = cpt.concept_id;
          }
          if ( node.code == code  ) {
            filteredConcepts.push(sp);
            found = true;
          }
        });
        if ( !found ) { // if it was not found in the links to bok its searched in the field concepts
          sp.concepts.forEach( cpt => {
            let code = '';
            if ( cpt.split(']').length >= 1  ) {
              code = cpt.split(']')[0].split('[')[1];
            } else {
              code = cpt;
            }
            if ( node.code == code  ) {
              filteredConcepts.push(sp);
              found = true;
            }
          });
        }
        //search if children have the concept
        this.getChildrenConceptsLink(sp, node.code, filteredConcepts);
      });
      toFilter = filteredConcepts;
    }
    if ( this.conceptsToSearch.length > 0 ) {
      this.filteredStudyPrograms = toFilter;
    } else {
      this.filterClean = this.filterClean ? false : true;
    }
  }

  getChildrenConceptsLink ( sp, codeToSearch, filteredConcepts ) {
    if (sp.children) {
      sp.children.forEach(mod => {
        mod.linksToBok.forEach(linkM => { // Module links
          if (linkM.concept_id == codeToSearch ) {
            if (filteredConcepts.indexOf(sp) === -1) {
              filteredConcepts.push(sp);
            }
          }
        });
        if (mod.children) {
          mod.children.forEach(cour => {
            cour.linksToBok.forEach(linkC => { // Course links
              if (linkC.concept_id == codeToSearch ) {
                if (filteredConcepts.indexOf(sp) === -1) {
                  filteredConcepts.push(sp);
                }
              }
            });
            if (cour.children) {
              cour.children.forEach(lect => {
                lect.linksToBok.forEach(linkL => { // Lecture links
                  if (linkL.concept_id == codeToSearch ) {
                    if (filteredConcepts.indexOf(sp) === -1) {
                      filteredConcepts.push(sp);
                    }
                  }
                });
              });
            }
          });
        }
      });
    }
  }
}
