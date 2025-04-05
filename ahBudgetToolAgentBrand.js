import { LightningElement, api,track,wire } from 'lwc';
import AhBudgetToolCustomCss from '@salesforce/resourceUrl/AhBudgetToolCustomCss';
import getAgentBrandRecordDetails from '@salesforce/apex/AhBudgetToolAgentBrands.getAgentBrandRecord';
import saveAgentBrandRecordDetails from '@salesforce/apex/AhBudgetToolAgentBrands.saveAgentBrandRecord';

import {loadStyle } from 'lightning/platformResourceLoader';

export default class AhBudgetToolAgentBrand extends LightningElement {

    @api elementLabelInfos;
    @api budgetToolMatrix;
    @api budgetPrcDisRec;
    @api budgetAllInfoRec;
    @api budgetTTCMapRec;
    error;
    atmTSOptionsNew = [
        { value: '0', label: 'None' },
        { value: '4500', label: '$4500' }
    ];
    m1STSOptionsNew  = [
        { value: '0', label: 'None'},
        { value: '180', label: '$180 - Proxy Agent Domain' },
        { value: '348', label: '$348 - M1 Site' },
        { value: '648', label: '$648 - M2 Site' }
    ];
    dmfMonthOptionsNew = [
        { value: '0', label: 'None'},
        { value: '1', label: '6 Months' },
        { value: '2', label: '12 Months' }
    ];
    dmfTypeOptionsNew = [
        { value: '0', label: 'None'},
        { value: '832', label: 'Monthly' },
        { value: '1440', label: 'Bi-Weekly' }
    ];
    dcpMonthOptionsNew = [
        { value: '0', label: 'None'},
        { value: '1', label: '6 Months' },
        { value: '2', label: '12 Months' }
    ];
    dcpOptionsNew = [
        { value: '0', label: 'None'},
        { value: '3810', label: 'DAC' },
        { value: '5220', label: 'B/T Premium + Video' },
        { value: '4170', label: 'B/T Premium'},
        { value: '4020', label: 'B/T Essentials + Video' },
        { value: '2970', label: 'B/T Essentials' }
    ];

    @track dropdownValues = {
        m1STS: '0',
        atmTS: '0',
        dmfamonth: '0',
        dmfatype: '0',
        dcpmonth: '0',
        dcp: '0'
    }

    recordId; //'a5V75000000CsTOEA0', 'a5V75000000CsdVEAS'
    agentBrandRecord;
    wireRan = false;
    saveRan = false;

    @api
    getState() {
        return {
            error: this.error,
            budgetPrcDisRec: this.budgetPrcDisRec,
            dcpMonthOptionsNew : this.dcpMonthOptionsNew,
            atmTSOptionsNew: this.atmTSOptionsNew,
            m1STSOptionsNew: this.m1STSOptionsNew,
            dmfMonthOptionsNew: this.dmfMonthOptionsNew,
            dmfTypeOptionsNew: this.dmfTypeOptionsNew,
            dcpOptionsNew: this.dcpOptionsNew,
            dropdownValues: this.dropdownValues,
            recordId: this.recordId,
            agentBrandRecord: this.agentBrandRecord,
            wireRan: this.wireRan,
            handleChange: this.handleChange,
            handleDmfaTypeChange: this.handleDmfaTypeChange,
            handleDCPChange: this.handleDCPChange,
            saveAgentBrand: this.saveAgentBrand,
            saveRan: this.saveRan
        }
    }

    @wire(getAgentBrandRecordDetails,{recordId: '$recordId'}) 
    brandDetails({ error, data }) {
        this.wireRan = true;
        if (error) {
            this.error = "Failed to retrieve agent brand data" + error; 
            console.log("Failed to retrieve agent brand data", error);
        }else if(data){
            this.agentBrandRecord = data;
            this.setDropdownValues();
        } 
    }

    setDropdownValues(){
        this.dropdownValues.m1STS = String(this.agentBrandRecord.PrxAgntDomain_M1_M2_TS__c);
        this.dropdownValues.atmTS = String(this.agentBrandRecord.ATM_TS__c);
        this.dropdownValues.dmfamonth = String(this.agentBrandRecord.Digital_mkt_month__c);
        this.dropdownValues.dmfatype = String(this.agentBrandRecord.Digital_mkt_callfreq__c);
        this.dropdownValues.dcpmonth = String(this.agentBrandRecord.DCP_Months__c);
        this.dropdownValues.dcp = String(this.agentBrandRecord.DCP_Type__c);
    }

    renderedCallback() {
        Promise.all([
            loadStyle(this,AhBudgetToolCustomCss+'/AhBudgetToolCustomCss.css')       
        ]).then(()=>{
            
        });
    }

    handleChange(event) {
        let tempRec = {...this.agentBrandRecord};
        let changedValue = event.detail.value;

        if(changedValue || changedValue === '') {
            if(changedValue === ''){
                changedValue = 0;
            }
            if(event.target.name === 'adm'){
                tempRec.ADM_TS__c = parseFloat(changedValue * this.budgetPrcDisRec.Acquisition_Direct_Mail__c*12);
                tempRec.ADM_SFS__c = 0;
                tempRec.ADM_input__c = changedValue;
                tempRec.ADM_AAI__c = tempRec.ADM_TS__c - tempRec.ADM_SFS__c;
            }else if(event.target.name === 'atnTS'){
                tempRec.ATM_additional_tact_TS__c = parseFloat(changedValue * this.budgetPrcDisRec.ATM_Additional__c);
                tempRec.ATM_additional_tact_SFS__c = 0;
                tempRec.ATM_additional_tact_input__c = changedValue;
                tempRec.ATM_additional_tact_AAI__c = tempRec.ATM_additional_tact_TS__c - tempRec.ATM_additional_tact_SFS__c;
            }else if(event.target.name === 'atmTS'){
                this.dropdownValues.atmTS = changedValue;
                tempRec.ATM_TS__c = parseFloat(changedValue);
                tempRec.ATM_SFS__c = Math.round(parseFloat(changedValue) * this.budgetPrcDisRec.ATM__c);
                tempRec.ATM_AAI__c = tempRec.ATM_TS__c - tempRec.ATM_SFS__c;
            } else if(event.target.name === 'm1STS'){
                this.dropdownValues.m1STS = changedValue;
                tempRec.PrxAgntDomain_M1_M2_TS__c =  parseFloat(changedValue);
                tempRec.PrxAgntDomain_M1_M2_SFS__c = 0;
                tempRec.PrxAgntDomain_M1_M2_AAI__c = tempRec.PrxAgntDomain_M1_M2_TS__c - tempRec.PrxAgntDomain_M1_M2_SFS__c;
            } else if (event.target.name === 'seoTS'){
                tempRec.SEO_TS__c = parseFloat(changedValue);
                tempRec.SEO_SFS__c = 0;
                tempRec.SEO_AAI__c = tempRec.SEO_TS__c - tempRec.SEO_SFS__c;
            } else if (event.target.name === 'smaTS'){
                tempRec.Social_Media_Adv_TS__c = parseFloat(changedValue);
                tempRec.Social_Media_Adv_SFS__c = 0;
                tempRec.Social_Media_Adv_AAI__c = tempRec.Social_Media_Adv_TS__c - tempRec.Social_Media_Adv_SFS__c;
            } else if (event.target.name === 'obTS'){
                tempRec.Other_Branding_TS__c = parseFloat(changedValue);
                tempRec.Other_Branding_SFS__c = 0;
                tempRec.Other_Branding_Agent_Annual_Investment__c = tempRec.Other_Branding_TS__c - tempRec.Other_Branding_SFS__c;
            }
            this.agentBrandRecord = {...tempRec};
        }

        
    }

    handleDmfaTypeChange(event){
        let tempRec = {...this.agentBrandRecord};
        let changedValue = event.detail.value;

        if(changedValue !=='') {
            if(event.target.name === 'dmfamonth'){
                this.dropdownValues.dmfamonth = changedValue;
                tempRec.Digital_mkt_month__c = parseFloat(changedValue);
            } else if (event.target.name === 'dmfatype') {
                this.dropdownValues.dmfatype = changedValue;
                tempRec.Digital_mkt_callfreq__c = parseFloat(changedValue);
            }

            tempRec.Digital_mkt_TS__c = tempRec.Digital_mkt_month__c * tempRec.Digital_mkt_callfreq__c;
            tempRec.Digital_mkt_SFS__c = tempRec.Digital_mkt_TS__c * 0.5;
            tempRec.Digital_mkt_AAI__c = tempRec.Digital_mkt_TS__c - tempRec.Digital_mkt_SFS__c;
            
            
            this.agentBrandRecord = {...tempRec};
        }
    }

    handleDCPChange(event) {
        let tempRec = {...this.agentBrandRecord};
        let changedValue = event.detail.value;
        if(changedValue !=='') {
            if(event.target.name === 'dcpmonth'){
                this.dropdownValues.dcpmonth = changedValue;
                tempRec.DCP_Months__c = parseFloat(changedValue);
            } else if (event.target.name === 'dcp') {
                this.dropdownValues.dcp = changedValue;
                tempRec.DCP_Type__c = parseFloat(changedValue);
            }

            tempRec.Digital_Content_Prg_TS__c = tempRec.DCP_Months__c * tempRec.DCP_Type__c;
            tempRec.Digital_Content_Prg_SFS__c = tempRec.Digital_Content_Prg_TS__c * 0.5;
            tempRec.Digital_Content_Prg_AAI__c = tempRec.Digital_Content_Prg_TS__c - tempRec.Digital_Content_Prg_SFS__c;
            
            this.agentBrandRecord = {...tempRec};
        }
    }

    async saveAgentBrand(){
        console.log("saving agent brand");

        saveAgentBrandRecordDetails({ agentBrandRecord: this.agentBrandRecord})
            .then(result => {
                this.saveRan = true;
                console.log(result);
            }).catch(error => {
                this.error = 'Failed to save agent brand data ' + error
                console.log('Failed to save agent brand data ',error);
            });
    }

}