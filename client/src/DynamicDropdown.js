export default class DynamicDropdown {
    
    constructor(name) {
        this.name = name;
        this.active = true;
    }

    setCode(code) {
        this.code = code;
    }

    setData(data) {
        this.data = data
    }

    initialiseFilter() {
        this.filter = [...this.data.result];
    }

    clearFilter() {
        this.filter = [];
    }

    updateFilter(value, checked) {
        if (checked) {
            for (let i = 0; i < this.filter.length; i += 1) {
                if (value === this.filter[i]) {
                    this.filter.splice(i, 1);
                    break;
                }
            }
        } else {
            this.filter.push(value);
        }
    }

    isChecked(value) {
        let found = false;
        for (let i = 0; i < this.filter.length; i++) {
            if (value === this.filter[i])
            found = true;
        }
        return found;
    }

    isActive() {
        return this.active;
    }

    setActive(active) {
        this.active = active;
    }

    getCode() {
        return this.code;
    }

    getName() {
        return this.name
    }

    getData() {
        return this.data;
    }
}