;

import angular from 'angular';
import topNavModule from '../topnav';
import overviewTitleBarModule from '../visitor-title-bar';
import accordionModule from '../accordion';
import flexGridModule from '../flexgrid';
import { attach } from '../../utils';
import { actionCreators }  from '../../actions/actions';

const serviceDependencies = ['$q', '$ngRedux', '$scope', /*'$routeParams' /*injections as strings here*/];

const workGrid = [{imageSrc: 'generated/icon-sprite.svg#ico36_description', text: 'Post your need anonymously', detail: 'Some additional description here if necessary Nam sequatem nobitaquae molorat uritionRo magnatur, vollestis eiciuntis dunt vent aut isci consed minihillest, con eius. Git quiatur, odit landae pa si'},
    {imageSrc: 'generated/icon-sprite.svg#ico36_match', text: 'Your need is automatically matched with other users\' needs', detail: 'Some additional description here if necessary Nam sequatem nobitaquae molorat uritionRo magnatur, vollestis eiciuntis dunt vent aut isci consed minihillest, con eius. Git quiatur, odit landae pa si'},
    {imageSrc: 'generated/icon-sprite.svg#ico36_incoming', text: 'Request Contact', detail: 'Some additional description here if necessary Nam sequatem nobitaquae molorat uritionRo magnatur, vollestis eiciuntis dunt vent aut isci consed minihillest, con eius. Git quiatur, odit landae pa si', separatorText: 'or', text2: 'get other users\' contact requests'},
    {imageSrc: 'generated/icon-sprite.svg#ico36_message', text: 'Interact and exchange', detail: 'Some additional description here if necessary Nam sequatem nobitaquae molorat uritionRo magnatur, vollestis eiciuntis dunt vent aut isci consed minihillest, con eius. Git quiatur, odit landae pa si'}];

const peopleGrid = [{imageSrc: 'images/face1.png', text: '"I have something to offer"'},
    {imageSrc: 'images/face2.png', text: '"I want to have something"'},
    {imageSrc: 'images/face3.png', text: '"I want to do something together"'},
    {imageSrc: 'images/face4.png', text: '"I want to change something"'}];

const questions = [{title: "What about my personal data", detail: "1blablabla"},
    {title: "Who can view my posts", detail: "2blablabla"},
    {title: "Do I need to register?", detail: "3blablabla"},
    {title: "What about my personal data", detail: "4blablabla"},
    {title: "Who can view my posts", detail: "5blablabla"},
    {title: "Do I need to register?", detail: "5blablabla"},
    {title: "What about my personal data", detail: "5blablabla"},
    {title: "Who can view my posts", detail: "5blablabla"}];

class LandingpageController {
    constructor(/* arguments <- serviceDependencies */){
        attach(this, serviceDependencies, arguments);

        const signup = (state) => ({
            loggedIn: state.get('user').toJS().loggedIn,
            error: state.get('user').toJS().error
        });

        const disconnect = this.$ngRedux.connect(signup, actionCreators)(this);
        this.$scope.$on('$destroy',disconnect);

        this.questions = questions;
        this.peopleGrid = peopleGrid;
        this.workGrid = workGrid;
        this.moreInfo = false;
    }

    toggleMoreInfo(){
        this.moreInfo = !this.moreInfo;
    }
}

export default angular.module('won.owner.components.landingpage', [
    overviewTitleBarModule,
    accordionModule,
    topNavModule,
    flexGridModule
])
    .controller('LandingpageController', [...serviceDependencies, LandingpageController])
    .name;

