import { Component, OnInit, OnDestroy, Input, ViewChild, TemplateRef } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { NgForOf } from '@angular/common';
import { Observable, Subscription } from 'rxjs';

import { StudyProgramService, StudyProgram } from '../../services/studyprogram.service';
import { FormControl } from '@angular/forms';
import { ModalDirective, ModalOptions } from 'ngx-bootstrap/modal';
import { AngularFireAuth } from '@angular/fire/auth';
import { SlicePipe } from '@angular/common';
import { User, UserService } from '../../services/user.service';
import { OrganizationService } from '../../services/organization.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  studyPrograms: StudyProgram[];
  advancedSearch = false;
  affiliationFilter = false;
  knowledgeFilter = false;
  skillFilter = false;
  fieldFilter = false;
  filteredStudyPrograms: any[];
  resultsByAuthor: any[];
  resultsByDepth: any[];
  searchText: string;
  isAnonymous = null;
  ownUsrId = null;
  showOnlyDepth = -1;
  showOnlyAuthor = -1;
  currentUser: User;

  sortNameAsc = true;
  sortOrgAsc = true;
  sortUpdAsc = true;
  sortedBy = 'lastUpdated';

  public paginationLimitFrom = 0;
  public paginationLimitTo = 6;
  public LIMIT_PER_PAGE = 6;
  public currentPage = 0;

  @ViewChild('dangerModal') public dangerModal: ModalDirective;
  @ViewChild('releaseNotesModal') public releaseNotesModal: any;

  constructor(private studyprogramService: StudyProgramService,
    private userService: UserService,
    public organizationService: OrganizationService,
    private route: ActivatedRoute,
    public afAuth: AngularFireAuth) {
    this.afAuth.auth.onAuthStateChanged(user => {
      console.log(user);
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
  }

  ngOnInit() {
    this.studyprogramService
      .subscribeToStudyPrograms()
      .subscribe(studyPrograms => {
        this.studyPrograms = studyPrograms;
        if ( this.showOnlyDepth == -1 && this.showOnlyAuthor == -1 ){
          this.filteredStudyPrograms = studyPrograms;
        } else {
          this.resultsByDepth = studyPrograms;
          this.resultsByAuthor = studyPrograms;
          if ( this.showOnlyAuthor >= 0 ) {
            this.filterByAuthor(this.showOnlyAuthor);
          }
          if ( this.showOnlyDepth >= 0) {
            this.filterByDepth(this.showOnlyDepth);
          }
        }
        /*  this.studyPrograms.forEach(sp => {
           console.log('***---***');
           console.log(sp.name);
           console.log('***');
           console.log(sp.orgName);
           console.log('***');
           if (sp.competences) {
             sp.competences.forEach(c => {
               console.log(c.preferredLabel + ' --  uri:' + c.uri);
               console.log('***');
             });
           }
           if (sp.customCompetences) {
             sp.customCompetences.forEach(c => {
               console.log(c);
               console.log('***');
             });
           }
         }); */

        this.sortSPby(this.sortedBy);
      });

    if (this.route.snapshot.url[0].path === 'release-notes') {
      const config: ModalOptions = { backdrop: true, keyboard: true };
      this.releaseNotesModal.basicModal.config = config;
      this.releaseNotesModal.basicModal.show({});
    }
  }

  removeStudyProgram(id: string) {
    this.studyprogramService.removeStudyProgram(id);
    this.dangerModal.hide();
  }

  sortSPby(attr) {
    this.paginationLimitFrom = 0;
    this.paginationLimitTo = 6;
    this.currentPage = 0;
    switch (attr) {
      case 'name':
        console.log('Sort by: ' + attr + ' asc: ' + this.sortNameAsc);

        this.sortNameAsc = !this.sortNameAsc;
        this.sortedBy = 'name';
        this.filteredStudyPrograms.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? this.sortNameAsc ? 1 : -1 : this.sortNameAsc ? -1 : 1);
        break;
      case 'lastUpdated':
        console.log('Sort by: ' + attr + ' asc: ' + this.sortUpdAsc);

        this.sortUpdAsc = !this.sortUpdAsc;
        this.sortedBy = 'lastUpdated';
        this.filteredStudyPrograms.sort((a, b) => (a.updatedAt > b.updatedAt) ? this.sortUpdAsc ? 1 : -1 : this.sortUpdAsc ? -1 : 1);
        break;
      case 'organization':
        console.log('Sort by: ' + attr + ' asc: ' + this.sortOrgAsc);

        this.sortOrgAsc = !this.sortOrgAsc;
        this.sortedBy = 'organization';
        this.filteredStudyPrograms.sort((a, b) => (a.orgName.toLowerCase() > b.orgName.toLowerCase()) ? this.sortOrgAsc ? 1 : -1 : this.sortOrgAsc ? -1 : 1);
        break;

      case 'eqf':
        console.log('Sort by: ' + attr + ' eqf: ' + this.sortOrgAsc);
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
    const search = this.searchText.toLowerCase();
    this.filteredStudyPrograms = [];
    if (this.advancedSearch) {
      this.applyFilters();
    } else {
      this.filteredStudyPrograms = this.studyPrograms.filter(
        it =>
          it.name.toLowerCase().includes(search) ||
          it.description.toLowerCase().includes(search)
      );
    }
  }

  applyFilters() {
    this.studyPrograms.forEach(sp => {
      console.log(sp);
      if (!this.affiliationFilter && !this.knowledgeFilter && !this.skillFilter && !this.fieldFilter || this.searchText === '') {
        // if no filters checked, return all
        this.advancedSearch = false;
        this.filter();
        // this.filteredStudyPrograms.push(sp);
      } else {
        console.log('apply filters');
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
    //this.filteredStudyPrograms = [];
    this.resultsByDepth=[];
    this.paginationLimitFrom = 0;
    this.paginationLimitTo = 6;
    this.currentPage = 0;
    if (this.advancedSearch) {
      this.applyFilters();
    }
    if (depth === -1) {
      if ( this.showOnlyAuthor >= 0 ){
        this.filteredStudyPrograms = this.resultsByAuthor;
      } else {
        this.filteredStudyPrograms = this.studyPrograms;
      }

    } else {
      if ( this.showOnlyAuthor >= 0 ){
        this.filteredStudyPrograms = this.resultsByAuthor.filter(
          it =>
            it.depth === depth
        );
        this.resultsByAuthor = this.studyPrograms;
      }
      else {
        this.filteredStudyPrograms = this.studyPrograms.filter(
          it =>
            it.depth === depth
        );
      }

    }
    this.resultsByDepth= this.filteredStudyPrograms;
  }

  filterByAuthor(author) {
    //this.filteredStudyPrograms = [];
    this.resultsByAuthor=[];
    this.paginationLimitFrom = 0;
    this.paginationLimitTo = 6;
    this.currentPage = 0;
    if (this.advancedSearch) {
      this.applyFilters();
    }
    if (author === -1) { // all
      if (this.showOnlyDepth >= 0 ){
        this.filteredStudyPrograms = this.resultsByDepth;
      }
      else {
        this.filteredStudyPrograms = this.studyPrograms;
      }

    } else if (author === 0) { // mine
      if (this.showOnlyDepth >= 0 ){
        this.filteredStudyPrograms = this.resultsByDepth.filter(
          it =>
            it.userId === this.currentUser._id
        );
      } else {
        this.filteredStudyPrograms = this.studyPrograms.filter(
          it =>
            it.userId === this.currentUser._id
        );
      }

    } else if (author === 1) { // my orgs
      if (this.showOnlyDepth >= 0 ){
        this.filteredStudyPrograms = this.resultsByDepth.filter(
          it =>
            this.currentUser.organizations.includes(it.orgId)
        );
      } else {
        this.filteredStudyPrograms = this.studyPrograms.filter(
          it =>
            this.currentUser.organizations.includes(it.orgId)
        );
      }

    }
    this.resultsByAuthor= this.filteredStudyPrograms;
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
    console.log('Next Page: ' + this.paginationLimitFrom + ' to ' + this.paginationLimitTo + ' Current Page : ' + this.currentPage);
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.paginationLimitFrom = this.paginationLimitFrom - this.LIMIT_PER_PAGE;
      this.paginationLimitTo = this.paginationLimitTo - this.LIMIT_PER_PAGE;
      this.currentPage--;
    }
    console.log('Previous Page: ' + this.paginationLimitFrom + ' to ' + this.paginationLimitTo + ' Current Page : ' + this.currentPage);
  }
}
