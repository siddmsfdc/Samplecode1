import {LightningElement, track, wire, api } from 'lwc';
import LightningConfirm from 'lightning/confirm';
import 	AMHStyleCSS from '@salesforce/resourceUrl/AMHStyleCSS';
import {loadStyle  } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getRecord } from 'lightning/uiRecordApi';
import BUDGET_ALLOCATION_OBJECT from '@salesforce/schema/Agenthood_Budget_Allocation__c';
import YEAR_FIELD from '@salesforce/schema/Agenthood_Budget_Allocation__c.Year__c';
import CMT_FIELD from '@salesforce/schema/Agenthood_Budget_Allocation__c.Current_Marketing_Tier__c';
import fetchBudgetTTCMappingRecords from '@salesforce/apex/AHBudgetToolHelper.fetchBudgetTTCMappingRecords';
import fetchBudgetPricingDiscountRecs from '@salesforce/apex/AHBudgetToolHelper.fetchAgentBudgetRuleRecs';

import getUserTier from '@salesforce/apex/AMHBudgetAllocationController.getUserTier';
import fetchBudgetAllocationInfoRecs from '@salesforce/apex/AMHBudgetAllocationControllerExt.fetchBudgetAllocationInfoRecs';
import fetchBudgetProjectionInstructionsContent from '@salesforce/apex/AMHBudgetAllocationControllerExt.fetchBudgetProjectionInstructionsContent';
import AhBusinessPlanningLink from '@salesforce/label/c.AhBusinessPlanningLink';
import userId from '@salesforce/user/Id';
import UserNameField from '@salesforce/schema/User.Name';
import getBudgetAllocationDetails from '@salesforce/apex/AHBudgetToolController.getBudgetAllocationDetails';
import saveBudgetAllocationData from '@salesforce/apex/AHBudgetToolController.saveBudgetAllocationData';
import getSubUserType from '@salesforce/apex/AHBudgetToolHelper.getSubUserType';
import resetBudgetAllocationRecord from '@salesforce/apex/AHBudgetToolController.resetBudgetAllocationRecord';
import resetAgentBrandRecordDetails from '@salesforce/apex/AhBudgetToolAgentBrands.resetAgentBrandRecord';
import resetConvertOppRecordDetails from '@salesforce/apex/AhBudgetToolConvertOpportunity.resetConvertOppRecord';
import resetCreateOppRecordDetails from '@salesforce/apex/AhBudgetToolCreateOpportunities.resetCreateOppRecord';
import resetDeepRelRecordDetails from'@salesforce/apex/AhBudgetToolDeepenRelationships.resetDeepenRelationshipsRecord';

export default class  extends LightningElement {

    label = {
        AhBusinessPlanningLink
    };
    @track openFirst = true;
    selectedCMT = 'Tier 1';
    now = new Date();

    
    // Format the date to Central Time Zone (CT)
    centralTime = new Date(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', // Central Time Zone
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
    }).format(this.now));
    //centralTime = new Date('Wed Sep 18 2024 22:06:42 GMT-0500 (Central Daylight Time)');
    nextYearDate = 18;
    nextYearMonth = 8;
    
    currentYear = (new Date()).getFullYear();
    nOne = 1;
    isSelectedNextYear = new Date(new Date((new Date()).setDate(this.nextYearDate)).setMonth(this.nextYearMonth));
    selectedYear = this.calculateYear();
    //selectedYear = (new Date()).getMonth() > 9 ? (1 + (new Date().getFullYear())).toString() : (new Date().getFullYear()).toString();
    agentName = '';
    user_id = userId;
    isLoading = true;
    budgetTTCMapRec;
    budgetPrcDisRec;
    @track BPIDocumentContent = [];
    @track budgetAllInfoRec;
    @track budgetAllocationData = [];
    agentbrandrecord;
    createopportunityrecord;
    convertopportunityrecord;
    deepenrelationshiprecord;
    @track activeTab = 'Agent Brand';
    @track showAgentBrand = true;
    @track showCreateOpp = false;
    @track showConvertOpp = false;
    @track showDeepenRel = false;
    getBudgetAllocationInput;
    focusable;
    isBudgetProcessed = false;
    isBudgetCompleted = false;
    graphAttributes = [];
    
    @track activeSection;
    @track isModalOpen = false;
    @track modalContent = '';
    @track chartImageUrl;
    isAgent;
    isFSV;
    subUserType;
    tAgent = 'Agent';
    tFSV = 'FSV';

    template1 = 'lightning-combobox[data-name="cmt"]';
    template2 = 'lightning-input[data-name="bagr"]';
    template3 = 'lightning-input[data-name="baor"]';
    template4 = 'lightning-input[data-name="bamb"]';
    template5 = 'lightning-combobox[data-name="agentYear"]';
    childComp1 = 'c-ah-budget-tool-agent-brand';
    childComp2 = 'c-ah-budget-tool-create-opportunities';
    childComp3 = 'c-ah-budget-tool-convert-opportunties';
    childComp4 = 'c-ah-budget-tool-deepen-relationships';
    lcMessage = 'Are you want to save the data? If yes press Ok otherwise press cancel.';
    lcVariant = 'headerless';
    lcLabel = 'this is the aria-label value';
    customCss = '/Custom.css';
    get finalCss(){
        return `${AMHStyleCSS}${this.customCss}`;
    }
    calculateYear(){
        return this.centralTime >= this.isSelectedNextYear ? (this.nOne + this.currentYear).toString() : this.currentYear.toString();
    }
    //added this method for Jest test
    @api
    getChangedState() {
        return {
            calculateYear: this.calculateYear,
            finalCss: this.finalCss,
            isFSV: this.isFSV,
            tFSV: this.tFSV,
            lcLabel: this.lcLabel,
            lcVariant: this.lcVariant,
            lcMessage: this.lcMessage,
            template5: this.template5,
            template1: this.template1,
            template2: this.template2,
            template3: this.template3,
            template4:this.template4,
            childComp1: this.childComp1,
            childComp2: this.childComp2,
            childComp3: this.childComp3,
            childComp4: this.childComp4,
            nextYearDate: this.nextYearDate,
            nextYearMonth: this.nextYearMonth,
            currentYear: this.currentYear,
            nOne: this.nOne,
            isSelectedNextYear: this.isSelectedNextYear,
            selectedYear: this.selectedYear,
            subUserType: this.subUserType,
            isAgent: this.isAgent,
            modalContent:this.modalContent,
            budgetAllInfoRec: this.budgetAllInfoRec,
            BPIDocumentContent: this.BPIDocumentContent,
            budgetPrcDisRec: this.budgetPrcDisRec,
            budgetTTCMapRec: this.budgetTTCMapRec,
            budgetAllocationData: this.budgetAllocationData,
            user_id: this.user_id,
            error: this.error,
            isLoading: this.isLoading,
            activeSection: this.activeSection,
            agentName: this.agentName,
            cmtOptions: this.cmtOptions,
            yearOptions: this.yearOptions,
            selectedCMT: this.selectedCMT,
            getBudgetAllocationInput: this.getBudgetAllocationInput,
            activeTab: this.activeTab,
            openFirst: this.openFirst,
            label: this.label,
            showCreateOpp: this.showCreateOpp,
            showConvertOpp: this.showConvertOpp,
            showDeepenRel: this.showDeepenRel,
            focusModal: this.focusModal,
            agentbrandrecord: this.agentbrandrecord,
            createopportunityrecord : this.createopportunityrecord,
            convertopportunityrecord : this.convertopportunityrecord,
            deepenrelationshiprecord: this.deepenrelationshiprecord,
            isBudgetProcessed: this.isBudgetProcessed,
            isBudgetCompleted: this.isBudgetCompleted,
            handleActiveTab: this.handleActiveTab,
            handleBudgetAlloc: this.handleBudgetAlloc,
            calculateGrossPercent: this.calculateGrossPercent,
            updateChart: this.updateChart,
            updateBATStatus: this.updateBATStatus,
            handleSectionToggle: this.handleSectionToggle,
            collapseAll: this.collapseAll,
            isModalOpen: this.isModalOpen,
            graphAttributes: this.graphAttributes,
            tAgent: this.tAgent,
            expandAll: this.expandAll,
            handleSave: this.handleSave,
            validateBudget: this.validateBudget,
            getSubUserTypeInfo: this.getSubUserTypeInfo,
            handleClear: this.handleClear,
            resetDefaultValues: this.resetDefaultValues,
            templateUpdates: this.templateUpdates,
            templateHandleClear: this.templateHandleClear,
            clearUIFields: this.clearUIFields,
            resetChildRec : this.resetChildRec,
            customCss: this.customCss,
            centralTime: this.centralTime,
            agentbrandrecorderror:this.agentbrandrecorderror,
            createopportunityrecorderror:this.createopportunityrecorderror,
            convertopportunityrecorderror:this.convertopportunityrecorderror,
            deepenrelationshiprecorderror:this.deepenrelationshiprecorderror,
            budgetAllocationDataerror:this.budgetAllocationDataerror
        }
    }

    @wire(getRecord, { recordId: userId, fields: [UserNameField]})
    userDetails({data,error}) {
        if (data) {
            this.agentName = data.fields.Name.value;
        } else {
            this.error = error;
            this.budgetTTCMapRec = null;
        }
    }
   

    constructor() {
        super();
      
        fetchBudgetAllocationInfoRecs()
            .then(result => {
                this.budgetAllInfoRec = result;
        })
        .catch(error => {
            this.error = error;
        });
    }

    renderedCallback() {
        Promise.all([
            loadStyle(this, this.finalCss),
        ]).then(() => {
           
        });       
    }  

    @wire(fetchBudgetProjectionInstructionsContent)
    wiredBPIDocContent({ error, data }) {
        if (data) {
            this.BPIDocumentContent = data;
        }
        else{
            this.error = error;
        }
    }

    @wire(getObjectInfo, { objectApiName: BUDGET_ALLOCATION_OBJECT })
    budgetAllocationMetadata;

    // now get the current marketing tier picklist values
    @wire(getPicklistValues, {
        recordTypeId: '$budgetAllocationMetadata.data.defaultRecordTypeId',
        fieldApiName: CMT_FIELD
    }
    )
    cmtOptions;

    @wire(getPicklistValues,{
            recordTypeId: '$budgetAllocationMetadata.data.defaultRecordTypeId',
            fieldApiName: YEAR_FIELD
        }
    )
    yearOptions;

    async connectedCallback() {
        await Promise.resolve();
        this.user_id = userId;
        this.getUserTierInfo();
        this.activeSection = ['agentBrand', 'createOpportunity', 'convertOpportunity', 'deepenRelationship'];
        this.getSubUserTypeInfo();
    }
    getSubUserTypeInfo(){
        getSubUserType().then(result=>{
            this.subUserType = result;
            this.isAgent = this.subUserType === this.tAgent;
            this.isFSV = this.subUserType === this.tFSV;
        })
        .catch(error=>{
            this.error=error;
        });
    }

    getUserTierInfo(){
        getUserTier({ userId: this.user_id }).then(agentParticipationList => {
            if (agentParticipationList.length > 0 && agentParticipationList[0].Agent_Tier__c) {
                    this.selectedCMT =  isNaN(agentParticipationList[0].Agent_Tier__c)? agentParticipationList[0].Agent_Tier__c: 'Tier '+agentParticipationList[0].Agent_Tier__c;
            } else {
                this.selectedCMT = "Tier 1";
            }
            this.fetchBudgetAllocationData();
        })
        .catch(error=>{
            this.error = error;
        }).finally(()=>{
        })
    }

    @api handleSectionToggle(event) { 
        // Update activeSection with the current state of the accordion sections
        this.activeSection = event.detail.openSections;
        this.showAgentBrand = this.showCreateOpp = this.showConvertOpp = this.showDeepenRel = false;
    
        if (this.activeSection.includes('agentBrand')) {
            this.showAgentBrand = true;
        }
        if (this.activeSection.includes('createOpportunity')) {
            this.showCreateOpp = true;
        }
        if (this.activeSection.includes('convertOpportunity')) {
            this.showConvertOpp = true;
        }
        if (this.activeSection.includes('deepenRelationship')) {
            this.showDeepenRel = true;
        }
    }
    expandAll() {
        this.activeSection = ['agentBrand', 'createOpportunity', 'convertOpportunity', 'deepenRelationship'];
    }

    collapseAll() {
        this.activeSection = [];
    }

    @wire(fetchBudgetTTCMappingRecords,{selectedYear : '$selectedYear'})
    wiredBudgetTTCMapRecs(value) {
        const { data, error } = value;
        if (data) {
            this.budgetTTCMapRec = data;
            this.error = null;
        }
        else {
            this.error = error;
            this.budgetTTCMapRec = null;
        }
    }

    @wire(fetchBudgetPricingDiscountRecs, {selectedTier: '$selectedCMT' ,selectedYear : '$selectedYear'})
    wiredPricingDiscountRecs(value) {
        const {data, error} = value;
        if (data) {
            this.budgetPrcDisRec = data[0];
            this.error = null;
        }
        else{
            this.error = error;
            this.budgetPrcDisRec = null;
        }
    }

    handleCMTChange(event) {
        this.selectedCMT = event.detail.value;
        this.fetchBudgetAllocationData();
    }

    handleYearChange(event) {
        this.selectedYear = event.detail.value;
         this.fetchBudgetAllocationData();
    }

    handleBudgetAlloc(event) {
        let changedValue = event.detail.value;
        let temprec = { ...this.budgetAllocationData };
        if (event.target.name === 'baor') {
            temprec.Budget_Revenue_Percent__c = changedValue;
        }
        if (event.target.name === 'bagr') {
            temprec.Gross_Revenue__c = changedValue;
        }
        if (temprec.Budget_Revenue_Percent__c !== undefined && temprec.Gross_Revenue__c !== undefined) {
            temprec.Agent_Marketing_Budget__c = (temprec.Gross_Revenue__c * temprec.Budget_Revenue_Percent__c) / 100;
        }
        this.budgetAllocationData = { ...temprec };
        this.calculateGrossPercent();
        this.isBudgetProcessed = true;
    }

    fetchBudgetAllocationData() {
        this.getBudgetAllocationInput = JSON.stringify({ agentId: this.user_id, tier: this.selectedCMT, year: this.selectedYear });
        getBudgetAllocationDetails( {batInputsIn: this.getBudgetAllocationInput })
            .then(data => {
                if (data) {
                    this.budgetAllocationData = data;                      
                    if (!this.budgetAllocationData.Total_Investment_TS__c &&  !this.budgetAllocationData.Total_Investment_TS__c > 0) {
                        this.resetChildRec();
                        this.clearUIFields();
                    }
                    this.updateChart();
                } 
        })
        .catch(error => {
            this.error = error;
        }).finally(()=>{
            this.isLoading = false;
        })
    }

    updateChart() {
        this.graphAttributes = [{"Label__c":"Agent Brand","Input_2__c":this.budgetAllocationData.Agent_Brand_Chart__c},{"Label__c":"Convert Opportunities","Input_2__c":this.budgetAllocationData.Convert_Opportunity_Chart__c},{"Label__c":"Create Opportunities","Input_2__c":this.budgetAllocationData.Create_Opportunity_Chart__c},{"Label__c":"Deepen Relationships","Input_2__c":this.budgetAllocationData.Deepen_Relationship_Chart__c}]
        this.template.querySelector('c-ah-budget-tool-chart').refreshGraph(this.graphAttributes);
    }

    handleUpdateAgentBrand(event) {
        this.agentbrandrecord = event.detail.agentbrandrecord;
        this.budgetAllocationData = event.detail.record;
        this.calculateGrossPercent();
        this.calculateChartPercent();
    }

    handleUpdateCreateOpportunity(event) {
        this.createopportunityrecord = event.detail.createopportunityrecord;
        this.budgetAllocationData = event.detail.record;
        this.calculateGrossPercent();
        this.calculateChartPercent();
    }
    handleUpdateConvertOpportunity(event) {
        this.convertopportunityrecord = event.detail.convertopportunityrecord;
        this.budgetAllocationData = event.detail.record;
        this.calculateGrossPercent();
        this.calculateChartPercent();
    }
    handleUpdateDeepenRelationship(event) {
        this.deepenrelationshiprecord = event.detail.deepenrelationshiprecord;
        this.budgetAllocationData = event.detail.record;
        this.calculateGrossPercent();
        this.calculateChartPercent();
    }

    calculateChartPercent() {
        let tempBatrec = { ...this.budgetAllocationData };
        if (this.agentbrandrecord) {
            let tempAgentBrndRec = { ...this.agentbrandrecord };
            tempAgentBrndRec.Agent_Brand_Chart__c = Math.round((tempAgentBrndRec.Total_TS__c / tempBatrec.Total_Investment_TS__c) * 100);
            tempBatrec.Agent_Brand_Chart__c = tempAgentBrndRec.Agent_Brand_Chart__c;
            this.agentbrandrecord = { ...tempAgentBrndRec };
        }
        if (this.createopportunityrecord) {
            let tempCreateOppRec = { ...this.createopportunityrecord };
            tempCreateOppRec.Create_Opportunity_Chart__c = Math.round((tempCreateOppRec.Total_TS__c / tempBatrec.Total_Investment_TS__c) * 100);
            tempBatrec.Create_Opportunity_Chart__c = tempCreateOppRec.Create_Opportunity_Chart__c;
            this.createopportunityrecord = { ...tempCreateOppRec };
        }
        if (this.convertopportunityrecord) {
            let tempConvertOppRec = { ...this.convertopportunityrecord };
            tempConvertOppRec.Convert_Opportunity_Chart__c = Math.round((tempConvertOppRec.Total_TS__c / tempBatrec.Total_Investment_TS__c) * 100);
            tempBatrec.Convert_Opportunity_Chart__c = tempConvertOppRec.Convert_Opportunity_Chart__c;
            this.convertopportunityrecord = { ...tempConvertOppRec };
        }
        if (this.deepenrelationshiprecord) {
            let tempDeepenRelRec = { ...this.deepenrelationshiprecord };
            tempDeepenRelRec.Deepen_Relationship_Chart__c = Math.round((tempDeepenRelRec.Total_TS__c / tempBatrec.Total_Investment_TS__c) * 100);
            tempBatrec.Deepen_Relationship_Chart__c = tempDeepenRelRec.Deepen_Relationship_Chart__c;
            this.deepenrelationshiprecord = { ...tempDeepenRelRec };
        }
        this.budgetAllocationData = { ...tempBatrec };
        this.isBudgetCompleted = true;
        this.updateChart();
    }

    calculateGrossPercent() {
        let tempBatrec = { ...this.budgetAllocationData };
        tempBatrec.Gross_Revenue_Invested_Percent__c = tempBatrec.Total_Investment_AAI__c / (10 * tempBatrec.Gross_Revenue__c) * 10;    
        this.budgetAllocationData = { ...tempBatrec };
    }

    async handleSave() {       
        if (this.validateBudget()) {
            
            const isSaveConfirm = await LightningConfirm.open({
                message: this.lcMessage,
                variant: this.lcVariant,
                label: this.lcLabel,
            });
            if (isSaveConfirm) {
                this.updateBATStatus();
                this.isLoading = true;
                const batjson = {
                    budgetAllocation: this.budgetAllocationData,
                    agentBrand: this.agentbrandrecord,
                    createOpportunity: this.createopportunityrecord,
                    convertOpportunity: this.convertopportunityrecord,
                    deepenRelationship: this.deepenrelationshiprecord
                };
                saveBudgetAllocationData({ batSave: JSON.stringify(batjson) }).then(result => {                    
                    if (result === 'success') {
                        this.isLoading = false;
                        const event = new ShowToastEvent({
                            title: 'Success',
                            message: 'Data has been saved successfully!',
                            variant: 'success',
                            mode: 'dismissable'
                        });
                        this.dispatchEvent(event);
                        
                    }
                }).catch(error => {
                    this.isLoading = false;
                    const event = new ShowToastEvent({
                        title: 'Error',
                        message: 'Data did not saved due to following error. ' + error,
                        variant: 'error',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(event);
                });
            }
        }
    } 
    
    updateBATStatus() {
        let tempBatrec = { ...this.budgetAllocationData };
        if (this.isBudgetProcessed) {
            tempBatrec.Budget_Status__c = "InProgress";
        }
        if (this.isBudgetCompleted) {
            tempBatrec.Budget_Status__c = "Completed";
        }
        this.budgetAllocationData = { ...tempBatrec };        
    }

    validateBudget() {
        let valid = true;
        let errorString = [];
        let errorMsg = "";
        if (!this.budgetAllocationData.Gross_Revenue__c) {
                errorString.push('Gross Revenue');
        }
        
        if (!this.budgetAllocationData.Budget_Revenue_Percent__c){
                  errorString.push('Budget as % of Revenue');
        }
        if (errorString[0] && errorString[1]) {
            errorMsg = "Please provide input for " + errorString[0] + " and " + errorString[1];
        } else if (errorString[0] || errorString[1]) {
            errorMsg = "Please provide input for " + errorString[0];
        } 
        if (errorMsg) {
            valid = false;
            const event = new ShowToastEvent({
                title: 'Error',
                message: errorMsg,
                variant: 'error',
                mode: 'dismissable'
            });
            this.dispatchEvent(event);
        }
        return valid;
    }

    @api handleClear(){
        this.resetDefaultValues();

        this.selectedYear= this.calculateYear();
        this.selectedCMT='Tier 1';
        this.templateUpdates(this.template5,this.selectedYear);
        this.templateUpdates(this.template1,this.selectedCMT);
        this.clearUIFields();
    
    }

    clearUIFields() {
        this.templateUpdates(this.template2,null);
        this.templateUpdates(this.template3,null);
        this.templateUpdates(this.template4,null);

        this.templateHandleClear(this.childComp1);
        this.templateHandleClear(this.childComp2);
        this.templateHandleClear(this.childComp3);
        this.templateHandleClear(this.childComp4);
    }

    templateUpdates(querySelectorName, value){
        this.template.querySelector(querySelectorName).value = value ;
    }
    templateHandleClear(querySelectorName){
        this.template.querySelector(querySelectorName).handleClear() ;
    }
    resetDefaultValues() {
        this.resetChildRec();
        if(this.budgetAllocationData){
            resetBudgetAllocationRecord({ batReset: JSON.stringify(this.budgetAllocationData) })
                .then(data => {
                    if (data) {
                        this.budgetAllocationData = data;
                        this.updateChart();
                    }
                })
                .catch(error => {
                    this.budgetAllocationDataerror = error;
                });
        }
    }

    resetChildRec() {
        this.resetAgentBrand();
        this.resetCreateOpportunity();
        this.resetConvertOpportunity();
        this.resetDeepenRelationship();    
    }

    resetAgentBrand() {
        if (this.agentbrandrecord) {
            resetAgentBrandRecordDetails({ agentBrandRecord: JSON.stringify(this.agentbrandrecord) })
                .then(data => {
                    if (data) {
                        this.agentbrandrecord = data;
                    }
                })
                .catch(error => {
                    this.agentbrandrecorderror = error;
                });
        }
    }

    resetCreateOpportunity() {
        if (this.createopportunityrecord ) {           
            resetCreateOppRecordDetails({ createOppRecord: JSON.stringify(this.createopportunityrecord) })
                .then(data => {
                    if (data) {
                        this.createopportunityrecord = data;
                    }
                })
                .catch(error => {
                    this.createopportunityrecorderror = error;
                });
        }
    }

    resetConvertOpportunity() {
        if (this.convertopportunityrecord ) {                   
            resetConvertOppRecordDetails({ convertOppRecord: JSON.stringify(this.convertopportunityrecord) })
                .then(data => {
                    if (data) {
                        this.convertopportunityrecord = data;
                    }
                })
                .catch(error => {
                    this.convertopportunityrecorderror = error;
                });
        }
    }


    resetDeepenRelationship() {
        if (this.deepenrelationshiprecord) {
            resetDeepRelRecordDetails({ deepenRelRecord: JSON.stringify(this.deepenrelationshiprecord) })
                .then(data => {
                if (data) {
                    this.deepenrelationshiprecord = data;
                }
            })
            .catch(error => {
                this.deepenrelationshiprecorderror = error;
            });
        }
    }
    
        
}



